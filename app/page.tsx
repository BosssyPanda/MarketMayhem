"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConsolePanel from "@/components/Console";
import Controls from "@/components/Controls";
import Editor from "@/components/Editor";
import FarmView from "@/components/FarmView";
import Inspector from "@/components/Inspector";
import LessonPanel from "@/components/LessonPanel";
import { deriveState } from "@/lib/animate";
import {
  buildStrategySource,
  clearAllStrategyCode,
  clearFarmState,
  clearStrategyCode,
  computeNewlyUnlocked,
  createDefaultFarmState,
  extractStrategyEditableSource,
  isValidRunStateTransition,
  loadFarmState,
  loadStrategyCode,
  resolveCommittedFarmStateAfterPlayback,
  saveFarmState,
  saveStrategyCode,
} from "@/lib/persist";
import { FALLBACK_CATALOG } from "@/lib/types";
import type { FarmState, Frame, ObjectiveCatalog, ObjectiveInfo, RunResponse } from "@/lib/types";

const PLAYBACK_MS = 450;
const EMPTY_FRAMES: Frame[] = [];

interface PlaybackRun {
  response: RunResponse;
  baseFarmState: FarmState;
  canCommit: boolean;
}

export default function Page() {
  const [catalog, setCatalog] = useState<ObjectiveCatalog>(FALLBACK_CATALOG);
  const [storageReady, setStorageReady] = useState(false);
  const [farmState, setFarmState] = useState<FarmState>(() => createDefaultFarmState(FALLBACK_CATALOG.objectives[0].id));
  const [result, setResult] = useState<RunResponse | null>(null);
  const [playback, setPlayback] = useState<PlaybackRun | null>(null);
  const [index, setIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>(() => {
    const initialObjective = FALLBACK_CATALOG.objectives[0];
    return {
      [initialObjective.id]: extractStrategyEditableSource(initialObjective.starter),
    };
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      const persistedFarmState = loadFarmState(FALLBACK_CATALOG.objectives[0].id);
      const persistedObjective = resolveObjective(FALLBACK_CATALOG, persistedFarmState.currentObjectiveId);
      setFarmState(persistedFarmState);
      setCodeDrafts((drafts) => ({
        ...drafts,
        [persistedObjective.id]: extractStrategyEditableSource(loadStrategyCode(persistedObjective.id, persistedObjective.starter)),
      }));
      setStorageReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    void fetch("/api/objectives")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Objective catalog request failed: ${response.status}`);
        return (await response.json()) as ObjectiveCatalog;
      })
      .then((nextCatalog) => {
        if (alive) setCatalog(nextCatalog);
      })
      .catch(() => {
        if (alive) setCatalog(FALLBACK_CATALOG);
      });

    return () => {
      alive = false;
    };
  }, []);

  const objective = useMemo(() => resolveObjective(catalog, farmState.currentObjectiveId), [catalog, farmState.currentObjectiveId]);
  const code = codeDrafts[objective.id] ?? extractStrategyEditableSource(loadStrategyCode(objective.id, objective.starter));
  const runObjective = result?.objective ?? null;
  const resultObjective = result ? resolveObjective(catalog, result.objective.id) : null;
  const progress =
    result?.objective.id === objective.id ? result.concepts[objective.concept] ?? farmState.concepts[objective.concept] : farmState.concepts[objective.concept];
  const unlocked = farmState.unlocked;
  const newlyUnlocked = result?.newlyUnlocked ?? [];
  const frames = playback?.response.frames ?? EMPTY_FRAMES;
  const renderFarmState = playback?.baseFarmState ?? farmState;
  const state = useMemo(() => deriveState(renderFarmState, frames, index), [renderFarmState, frames, index]);
  useEffect(() => {
    if (storageReady) saveFarmState(farmState);
  }, [farmState, storageReady]);

  const runCode = useCallback(async () => {
    const submittedFarmState = farmState;
    setRunning(true);
    stopTimer();
    setPlayback(null);
    setResult(null);
    setIndex(-1);
    setPlaying(false);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: buildStrategySource(code), farmState: submittedFarmState }),
      });
      const data = (await response.json()) as RunResponse;
      const runNewlyUnlocked = computeNewlyUnlocked(submittedFarmState, data);
      const normalizedResult: RunResponse = { ...data, newlyUnlocked: runNewlyUnlocked };
      const canCommit = isValidRunStateTransition(normalizedResult);

      setResult(normalizedResult);
      setPlayback({ response: normalizedResult, baseFarmState: submittedFarmState, canCommit });

      if (normalizedResult.frames.length > 0) {
        setPlaying(true);
      } else {
        setFarmState((current) => resolveCommittedFarmStateAfterPlayback(current, normalizedResult, canCommit));
        setPlayback(null);
      }
    } catch (error) {
      const failure: RunResponse = {
        ok: false,
        compiled: false,
        compileErrors: "",
        runtimeError: `Could not reach /api/run: ${String(error)}`,
        stdout: "",
        ticks: 0,
        tickLimit: 0,
        frames: [],
        farmState,
        objective: { id: "", concept: "", checks: [], passed: false },
        unlocked: [],
        newlyUnlocked: [],
        concepts: {},
      };
      setResult(failure);
      setPlayback({ response: failure, baseFarmState: submittedFarmState, canCommit: false });
    } finally {
      setRunning(false);
    }
  }, [code, farmState, stopTimer]);

  useEffect(() => {
    if (!playing) return;

    timer.current = setInterval(() => {
      setIndex((current) => {
        const next = Math.min(current + 1, frames.length - 1);
        if (next >= frames.length - 1) {
          setPlaying(false);
          if (playback) {
            setFarmState((currentFarmState) =>
              resolveCommittedFarmStateAfterPlayback(currentFarmState, playback.response, playback.canCommit),
            );
            setPlayback(null);
          }
        }
        return next;
      });
    }, PLAYBACK_MS);

    return () => stopTimer();
  }, [frames.length, playback, playing, stopTimer]);

  const handleCodeChange = useCallback(
    (next: string) => {
      setCodeDrafts((drafts) => ({ ...drafts, [objective.id]: next }));
      saveStrategyCode(objective.id, next);
    },
    [objective.id],
  );

  const resetPlayback = useCallback(() => {
    stopTimer();
    setResult(null);
    setPlayback(null);
    setIndex(-1);
    setPlaying(false);
  }, [stopTimer]);

  const resetCurrentCode = useCallback(() => {
    resetPlayback();
    clearStrategyCode(objective.id);
    setCodeDrafts((drafts) => ({ ...drafts, [objective.id]: extractStrategyEditableSource(objective.starter) }));
  }, [objective.id, objective.starter, resetPlayback]);

  const resetFarm = useCallback(() => {
    const firstObjectiveId = catalog.objectives[0]?.id ?? FALLBACK_CATALOG.objectives[0].id;
    const nextState = createDefaultFarmState(firstObjectiveId);
    resetPlayback();
    clearFarmState();
    clearAllStrategyCode();
    saveFarmState(nextState);
    setFarmState(nextState);
    setCodeDrafts({});
  }, [catalog.objectives, resetPlayback]);

  return (
    <main className="app">
      <header className="topbar">
        <h1>
          Market Mayhem <span className="accent">Farm Bots</span>
        </h1>
        <span className="tag">{objective.concept}</span>
      </header>

      <div className="layout">
        <section className="col col-left">
          <LessonPanel
            objective={objective}
            result={runObjective}
            resultObjective={resultObjective}
            progress={progress}
            unlocked={unlocked}
            newlyUnlocked={newlyUnlocked}
          />
          <Editor value={code} onChange={handleCodeChange} />
          <Controls
            onRun={runCode}
            onResetCurrent={resetCurrentCode}
            onResetFarm={resetFarm}
            running={running}
            objective={objective}
          />
          <ConsolePanel result={result} />
        </section>

        <section className="col col-right">
          <FarmView width={renderFarmState.width} height={renderFarmState.height} farmState={renderFarmState} state={state} />
          <Inspector state={state} farmState={farmState} objective={objective} result={result} />
        </section>
      </div>
    </main>
  );
}

function resolveObjective(catalog: ObjectiveCatalog, currentObjectiveId: string): ObjectiveInfo {
  return catalog.objectives.find((objective) => objective.id === currentObjectiveId) ?? catalog.objectives[0] ?? FALLBACK_CATALOG.objectives[0];
}
