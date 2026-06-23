"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Celebration from "@/components/Celebration";
import ConceptsMap from "@/components/ConceptsMap";
import ConsolePanel from "@/components/Console";
import Controls from "@/components/Controls";
import Editor from "@/components/Editor";
import FarmView from "@/components/FarmView";
import GameWindow from "@/components/GameWindow";
import Inspector from "@/components/Inspector";
import LessonPanel from "@/components/LessonPanel";
import MusicController from "@/components/MusicController";
import PracticePanel from "@/components/PracticePanel";
import ResourceBar from "@/components/ResourceBar";
import Toolbar from "@/components/Toolbar";
import { deriveState } from "@/lib/animate";
import { hasDrills, learningLadder, recordDrillResult, type Drill } from "@/lib/drills";
import { DURATION, EASE } from "@/lib/motion";
import { primeSfx, sfxComplete, sfxHarvest, sfxPlant } from "@/lib/sfx";
import {
  buildStrategySource,
  clearAllStrategyCode,
  clearFarmState,
  clearLayout,
  clearPractice,
  clearStrategyCode,
  computeNewlyUnlocked,
  createDefaultFarmState,
  extractStrategyEditableSource,
  isValidRunStateTransition,
  loadFarmState,
  loadLayout,
  loadPractice,
  loadStrategyCode,
  resolveCommittedFarmStateAfterPlayback,
  saveFarmState,
  saveLayout,
  savePractice,
  saveStrategyCode,
} from "@/lib/persist";
import type { LayoutState, PracticeState } from "@/lib/persist";
import { FALLBACK_CATALOG } from "@/lib/types";
import type { FarmState, Frame, ObjectiveCatalog, ObjectiveInfo, RunResponse } from "@/lib/types";

const PLAYBACK_MS = 150;
const EMPTY_FRAMES: Frame[] = [];

// Windows start tidy in two side rails; the ⤢ button pops any one out to a
// draggable floating window. The Concepts roadmap is hidden until toggled.
type WindowId = "objective" | "strategy" | "inspector" | "console" | "concepts" | "drills";

const DEFAULT_LAYOUT: LayoutState = {
  objective: { mode: "docked" },
  strategy: { mode: "docked" },
  inspector: { mode: "docked" },
  console: { mode: "docked" },
  concepts: { mode: "floating", closed: true },
  drills: { mode: "floating", closed: true },
};

// Spawn positions used when a window is floating.
const FLOAT_POS: Record<WindowId, { x: number; y: number }> = {
  objective: { x: 32, y: 64 },
  strategy: { x: 880, y: 64 },
  inspector: { x: 32, y: 540 },
  console: { x: 880, y: 600 },
  concepts: { x: 440, y: 120 },
  drills: { x: 470, y: 150 },
};

function mergeLayout(base: LayoutState, persisted: LayoutState): LayoutState {
  const out: LayoutState = {};
  for (const id of Object.keys(base)) {
    out[id] = { ...base[id], ...(persisted[id] ?? {}) };
  }
  return out;
}

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
  // Bumped once per run that has frames; the playback effect keys off this so it
  // starts exactly once per run (no frames/playback dep churn → no dropped runs).
  const [playbackSeq, setPlaybackSeq] = useState(0);
  const [celebration, setCelebration] = useState<{ key: number; title: string; subtitle?: string } | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [practice, setPractice] = useState<PracticeState>({});
  const [drillFocus, setDrillFocus] = useState<string | undefined>(undefined);
  const [practicePrompt, setPracticePrompt] = useState<{ concept: string; reason: "recap" | "reinforce" } | null>(null);
  const recapShownRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>(() => {
    const initialObjective = FALLBACK_CATALOG.objectives[0];
    return {
      [initialObjective.id]: extractStrategyEditableSource(initialObjective.starter),
    };
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackRef = useRef<PlaybackRun | null>(null);

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
      setLayout((current) => mergeLayout(current, loadLayout()));
      setPractice(loadPractice());
      setStorageReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // The saved window layout is restored in the mount microtask above, so SSR +
  // first client render both use DEFAULT_LAYOUT (no hydration mismatch).
  const updateWindow = useCallback((id: WindowId, patch: Partial<LayoutState[string]>) => {
    setLayout((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveLayout(next);
      return next;
    });
  }, []);

  const floatWindow = useCallback((id: WindowId) => updateWindow(id, { mode: "floating" }), [updateWindow]);
  const dockWindow = useCallback((id: WindowId) => updateWindow(id, { mode: "docked" }), [updateWindow]);
  const conceptsOpen = !(layout.concepts?.closed ?? true);
  const toggleConcepts = useCallback(() => {
    setLayout((prev) => {
      const next = { ...prev, concepts: { ...prev.concepts, closed: !(prev.concepts?.closed ?? true) } };
      saveLayout(next);
      return next;
    });
  }, []);

  const drillsOpen = !(layout.drills?.closed ?? true);
  const setDrillsClosed = useCallback((closed: boolean) => {
    setLayout((prev) => {
      const next = { ...prev, drills: { ...prev.drills, closed } };
      saveLayout(next);
      return next;
    });
  }, []);
  const toggleDrills = useCallback(() => setDrillsClosed(drillsOpen), [drillsOpen, setDrillsClosed]);

  // Open the Drills window focused on a concept (from a recap/reinforce CTA).
  const openDrills = useCallback(
    (concept?: string) => {
      setDrillFocus(concept);
      setPracticePrompt(null);
      setDrillsClosed(false);
    },
    [setDrillsClosed],
  );

  const recordResult = useCallback((drill: Drill, correct: boolean) => {
    setPractice((prev) => {
      const next = recordDrillResult(prev, drill, correct);
      savePractice(next);
      return next;
    });
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
  // While a run plays back, glow the Strategy line the panda is executing. The
  // engine reports the line in the full wrapped source; the editor shows the
  // class body, so shift up by the one wrapper line.
  const activeFrameLine = index >= 0 && index < frames.length ? frames[index]?.line : undefined;
  const highlightLine = playing && activeFrameLine ? Math.max(1, activeFrameLine - 1) : undefined;
  useEffect(() => {
    if (storageReady) saveFarmState(farmState);
  }, [farmState, storageReady]);

  // Beginner-first practice ladder: the whole curriculum (variables → … → sort)
  // is browsable from the very start, not gated behind engine-core progress, so
  // a total beginner can begin at the absolute beginning and ramp up.
  const reachedConcepts = useMemo(() => {
    const ladder = learningLadder();
    return ladder.length ? ladder : [objective.concept];
  }, [objective.concept]);

  // A concept the engine flagged for recap (repeated failures) that we can drill.
  const recapConcept = useMemo(() => {
    for (const [concept, p] of Object.entries(farmState.concepts)) {
      if (p?.recapDue && hasDrills(concept)) return concept;
    }
    return null;
  }, [farmState.concepts]);

  // Surface a recap prompt once when a concept becomes due (the AGENTS.md §3 rule).
  useEffect(() => {
    if (recapConcept && recapShownRef.current !== recapConcept) {
      recapShownRef.current = recapConcept;
      setPracticePrompt({ concept: recapConcept, reason: "recap" });
    }
    if (!recapConcept) recapShownRef.current = null;
  }, [recapConcept]);

  // Fire the GSAP celebration once per passing run — AFTER the playback animation
  // finishes (so it lands after the panda's final action, not on the API result).
  const celebrateSeq = useRef(0);
  const fireCelebration = useCallback((response: RunResponse) => {
    if (!response.objective?.passed) return;
    celebrateSeq.current += 1;
    sfxComplete();
    const unlocks = response.newlyUnlocked ?? [];
    setCelebration({
      key: celebrateSeq.current,
      title: "Objective complete!",
      subtitle: unlocks.length ? `Unlocked ${unlocks.join(", ")}` : undefined,
    });
    // Offer a reinforce drill on the concept just passed (recap takes priority).
    const concept = response.objective.concept;
    if (concept && hasDrills(concept)) {
      setPracticePrompt((prev) => (prev?.reason === "recap" ? prev : { concept, reason: "reinforce" }));
    }
  }, []);

  const runCode = useCallback(async () => {
    const submittedFarmState = farmState;
    primeSfx(); // start the audio context within the click gesture
    setRunning(true);
    stopTimer();
    setPlayback(null);
    playbackRef.current = null;
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

      const pb: PlaybackRun = { response: normalizedResult, baseFarmState: submittedFarmState, canCommit };
      setResult(normalizedResult);
      setPlayback(pb);

      if (normalizedResult.frames.length > 0) {
        playbackRef.current = pb;
        setIndex(-1);
        setPlaying(true);
        setPlaybackSeq((s) => s + 1); // kick off the playback effect exactly once
      } else {
        setFarmState((current) => resolveCommittedFarmStateAfterPlayback(current, normalizedResult, canCommit));
        setPlayback(null);
        playbackRef.current = null;
        fireCelebration(normalizedResult); // no animation to wait for → fire now
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
  }, [code, farmState, stopTimer, fireCelebration]);

  // Playback runs exactly once per run (keyed on playbackSeq). A local counter
  // drives the index so the setIndex updater stays pure, and the end-of-run
  // commit happens once, outside the updater — no dropped/frozen runs.
  useEffect(() => {
    if (playbackSeq === 0) return;
    const pb = playbackRef.current;
    if (!pb) return;
    const playbackFrames = pb.response.frames;
    if (playbackFrames.length === 0) return;

    let i = -1;
    stopTimer();
    timer.current = setInterval(() => {
      i += 1;
      const act = playbackFrames[i]?.action;
      if (act?.type === "harvest") sfxHarvest();
      else if (act?.type === "plant") sfxPlant();
      setIndex(i);
      if (i >= playbackFrames.length - 1) {
        stopTimer();
        setPlaying(false);
        setFarmState((currentFarmState) =>
          resolveCommittedFarmStateAfterPlayback(currentFarmState, pb.response, pb.canCommit),
        );
        fireCelebration(pb.response); // once, after the final frame has played
        setPlayback(null);
        playbackRef.current = null;
      }
    }, PLAYBACK_MS);

    return () => stopTimer();
  }, [playbackSeq, stopTimer, fireCelebration]);

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
    playbackRef.current = null;
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
    clearLayout();
    clearPractice();
    saveFarmState(nextState);
    setFarmState(nextState);
    setCodeDrafts({});
    setLayout(DEFAULT_LAYOUT);
    setPractice({});
    setPracticePrompt(null);
    setDrillFocus(undefined);
    recapShownRef.current = null;
  }, [catalog.objectives, resetPlayback]);

  const runPill = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={running ? "running" : "idle"}
        className={`gwin-pill${running ? "" : " idle"}`}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 3 }}
        transition={{ duration: DURATION.quick, ease: EASE.standard }}
      >
        {running ? "● running" : "✎ editing"}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <main className="app shell">
      <FarmView
        width={renderFarmState.width}
        height={renderFarmState.height}
        farmState={renderFarmState}
        state={state}
        running={running || playing}
      />

      <ResourceBar resources={state.resources} tick={state.tick} />
      <Toolbar
        onRun={runCode}
        onResetFarm={resetFarm}
        onToggleInfo={() => setShowInfo((v) => !v)}
        onToggleConcepts={toggleConcepts}
        conceptsOn={conceptsOpen}
        onToggleDrills={toggleDrills}
        drillsOn={drillsOpen}
        onToggleMusic={() => setMusicOn((v) => !v)}
        musicOn={musicOn}
        running={running}
      />
      <MusicController on={musicOn} />

      <AnimatePresence>
        {practicePrompt ? (
          <motion.div
            className={`practice-banner ${practicePrompt.reason}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: DURATION.standard, ease: EASE.standard }}
          >
            <span>
              {practicePrompt.reason === "recap"
                ? `Recap due — ${practicePrompt.concept.replace(/-/g, " ")} keeps tripping you up. Drill it?`
                : `Nice! Lock in ${practicePrompt.concept.replace(/-/g, " ")} with a quick drill?`}
            </span>
            <div className="practice-banner-actions">
              <button className="btn primary" onClick={() => openDrills(practicePrompt.concept)}>
                Practice →
              </button>
              <button className="gwin-btn" aria-label="Dismiss" onClick={() => setPracticePrompt(null)}>
                ×
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="stage" ref={stageRef}>
        <div className="dock-rail left">
          <AnimatePresence>
            {showInfo ? (
              <GameWindow
                title="Objective"
                icon="✦"
                constraintsRef={stageRef}
                mode={layout.objective.mode}
                onFloat={() => floatWindow("objective")}
                onDock={() => dockWindow("objective")}
                initial={FLOAT_POS.objective}
                width={344}
                closable
                onClose={() => setShowInfo(false)}
              >
                <div className="gwin-pad">
                  <LessonPanel
                    objective={objective}
                    result={runObjective}
                    resultObjective={resultObjective}
                    progress={progress}
                    unlocked={unlocked}
                    newlyUnlocked={newlyUnlocked}
                  />
                </div>
              </GameWindow>
            ) : null}
          </AnimatePresence>

          <GameWindow
            title="Inspector"
            icon="◉"
            constraintsRef={stageRef}
            mode={layout.inspector.mode}
            onFloat={() => floatWindow("inspector")}
            onDock={() => dockWindow("inspector")}
            initial={FLOAT_POS.inspector}
            width={332}
          >
            <div className="gwin-pad">
              <Inspector state={state} result={result} />
            </div>
          </GameWindow>

          <AnimatePresence>
            {conceptsOpen ? (
              <GameWindow
                title="Concepts"
                icon="▦"
                constraintsRef={stageRef}
                mode={layout.concepts.mode}
                onFloat={() => floatWindow("concepts")}
                onDock={() => dockWindow("concepts")}
                initial={FLOAT_POS.concepts}
                width={360}
                closable
                onClose={toggleConcepts}
              >
                <div className="gwin-pad">
                  <ConceptsMap catalog={catalog} farmState={farmState} />
                </div>
              </GameWindow>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {drillsOpen ? (
              <GameWindow
                title="Skill Drills"
                icon="⚡"
                constraintsRef={stageRef}
                mode={layout.drills.mode}
                onFloat={() => floatWindow("drills")}
                onDock={() => dockWindow("drills")}
                initial={FLOAT_POS.drills}
                width={360}
                closable
                onClose={() => setDrillsClosed(true)}
              >
                <div className="gwin-pad">
                  <PracticePanel
                    concepts={reachedConcepts}
                    focusConcept={drillFocus}
                    practice={practice}
                    conceptProgress={farmState.concepts}
                    onResult={recordResult}
                  />
                </div>
              </GameWindow>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="dock-rail right">
          <GameWindow
            title="Strategy.java"
            constraintsRef={stageRef}
            mode={layout.strategy.mode}
            onFloat={() => floatWindow("strategy")}
            onDock={() => dockWindow("strategy")}
            initial={FLOAT_POS.strategy}
            width={368}
            onRun={runCode}
            runningPill={runPill}
          >
            <Editor value={code} onChange={handleCodeChange} highlightLine={highlightLine} />
            <div className="gwin-pad">
              <Controls
                onRun={runCode}
                onResetCurrent={resetCurrentCode}
                onResetFarm={resetFarm}
                running={running}
                objective={objective}
              />
            </div>
          </GameWindow>

          <GameWindow
            title="Console"
            icon="›_"
            constraintsRef={stageRef}
            mode={layout.console.mode}
            onFloat={() => floatWindow("console")}
            onDock={() => dockWindow("console")}
            initial={FLOAT_POS.console}
            width={368}
          >
            <div className="gwin-pad">
              <ConsolePanel result={result} />
            </div>
          </GameWindow>
        </div>
      </div>

      {celebration ? <Celebration key={celebration.key} title={celebration.title} subtitle={celebration.subtitle} /> : null}
    </main>
  );
}

function resolveObjective(catalog: ObjectiveCatalog, currentObjectiveId: string): ObjectiveInfo {
  return catalog.objectives.find((objective) => objective.id === currentObjectiveId) ?? catalog.objectives[0] ?? FALLBACK_CATALOG.objectives[0];
}
