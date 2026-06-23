"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { getConceptLesson } from "@/lib/curriculum";
import {
  checkPredict,
  collectWrongDrills,
  evaluateWriteLine,
  getDrillsForConcept,
  MASTERY_TARGET,
  pickDrill,
  practiceMastery,
  runWriteLine,
  totalXp,
  type Drill,
  type PredictDrill,
  type WriteLineDrill,
} from "@/lib/drills";
import { popIn, pressable } from "@/lib/motion";
import type { PracticeState } from "@/lib/persist";
import type { ConceptProgress } from "@/lib/types";

// Skill Drills — short active-recall challenges. Predict drills are checked
// instantly; write-line drills compile + run the typed line for real. Earns a
// separate practice XP/streak/mastery (never touches engine concept mastery).
export default function PracticePanel({
  concepts,
  focusConcept,
  practice,
  conceptProgress,
  onResult,
}: {
  concepts: string[];
  focusConcept?: string;
  practice: PracticeState;
  conceptProgress: Record<string, ConceptProgress>;
  onResult: (drill: Drill, correct: boolean) => void;
}) {
  const first = focusConcept && concepts.includes(focusConcept) ? focusConcept : concepts[0] ?? "";
  // Concept + its drill + the input live together so the opening drill is picked
  // exactly once (pickDrill is random) and the write-line scaffold stays in sync.
  const [current, setCurrent] = useState<{ concept: string; drill: Drill | null; line: string }>(() => {
    const d = first ? pickDrill(first, practice) : null;
    return { concept: first, drill: d, line: d?.kind === "write-line" ? d.starter : "" };
  });
  const [done, setDone] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<{ pass: boolean; reason: string } | null>(null);
  // Was the most recent answer right? Drives the honest verdict shown with the
  // explanation (a wrong predict must say so, not "nice").
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  // "Review my misses" mode: serve only drills the learner got wrong, across all
  // concepts, until they're cleared (recordDrillResult drops a drill from `wrong`
  // on a correct answer, so the pool shrinks as they re-master each one).
  const [review, setReview] = useState(false);

  const active = current.concept;
  const drill = current.drill;
  const line = current.line;
  const setLine = useCallback((v: string) => setCurrent((c) => ({ ...c, line: v })), []);

  const startDrill = useCallback(
    (concept: string, exclude?: string) => {
      const next = pickDrill(concept, practice, exclude);
      setReview(false);
      setCurrent({ concept, drill: next, line: next?.kind === "write-line" ? next.starter : "" });
      setDone(false);
      setPicked(null);
      setVerdict(null);
      setChecking(false);
      setLastCorrect(null);
    },
    [practice],
  );

  // Serve the next "miss" drill (across all concepts). Exits review when none left.
  const startReviewDrill = useCallback(
    (excludeId?: string) => {
      const pool = collectWrongDrills(practice).filter((d) => d.id !== excludeId);
      if (pool.length === 0) {
        setReview(false);
        return;
      }
      const next = pool[Math.floor(Math.random() * pool.length)];
      setReview(true);
      setCurrent({ concept: next.concept, drill: next, line: next.kind === "write-line" ? next.starter : "" });
      setDone(false);
      setPicked(null);
      setVerdict(null);
      setChecking(false);
      setLastCorrect(null);
    },
    [practice],
  );

  // Jump to a forced concept (recap / reinforce / warm-up) when it changes.
  // Deferred so the setState happens outside the effect body.
  useEffect(() => {
    if (focusConcept && focusConcept !== active && getDrillsForConcept(focusConcept).length > 0) {
      queueMicrotask(() => startDrill(focusConcept));
    }
  }, [focusConcept, active, startDrill]);

  if (!active || !drill) {
    return (
      <div className="panel practice">
        <p className="muted small">Drills unlock as you reach concepts. Run an objective, then come back to practice.</p>
      </div>
    );
  }

  const cp = practice[active];
  const masteryPct = Math.round(practiceMastery(practice, active) * 100);
  const streak = cp?.streak ?? 0;
  const missCount = collectWrongDrills(practice).length;
  // Targeted feedback for a wrong predict pick: the note for that exact choice.
  const wrongPredictNote =
    lastCorrect === false && drill.kind === "predict" && picked != null ? drill.choiceNotes?.[picked] ?? null : null;

  const answerPredict = (d: PredictDrill, idx: number) => {
    if (done) return;
    const ok = checkPredict(d, idx);
    setPicked(idx);
    setDone(true);
    setLastCorrect(ok);
    onResult(d, ok);
  };

  const checkWrite = async (d: WriteLineDrill) => {
    setChecking(true);
    try {
      const run = await runWriteLine(d, line);
      const v = evaluateWriteLine(d, run);
      setVerdict(v);
      setLastCorrect(v.pass);
      onResult(d, v.pass);
      if (v.pass) setDone(true);
    } catch {
      setVerdict({ pass: false, reason: "Couldn't reach the runner — check the dev server and try again." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="panel practice">
      {/* review-misses mode: re-drill exactly what you got wrong, until cleared */}
      {review ? (
        <div className="drill-review-bar" role="status">
          <span>
            Reviewing your misses — <b>{missCount}</b> left
          </span>
          <button className="btn ghost" onClick={() => startDrill(concepts[0] ?? active)}>
            done
          </button>
        </div>
      ) : missCount > 0 ? (
        <button className="drill-review-cta" onClick={() => startReviewDrill()}>
          ↻ Review my misses ({missCount})
        </button>
      ) : null}

      {/* concept switcher */}
      <div className="drill-concepts">
        {concepts.map((c) => {
          const l = getConceptLesson(c);
          const recap = conceptProgress[c]?.recapDue;
          return (
            <button
              key={c}
              className={`drill-chip${c === active ? " active" : ""}${recap ? " recap" : ""}`}
              onClick={() => startDrill(c)}
              title={recap ? "Recap due" : undefined}
            >
              {l?.title ?? c.replace(/-/g, " ")}
              {recap ? <span className="recap-dot" aria-label="recap due">●</span> : null}
            </button>
          );
        })}
      </div>

      {/* progress header */}
      <div className="drill-head">
        <div className="drill-mastery">
          <div className="drill-bar">
            <span style={{ width: `${masteryPct}%` }} />
          </div>
          <span className="muted small">
            {cp?.done ?? 0}/{MASTERY_TARGET} mastered
          </span>
        </div>
        <div className="drill-stats">
          <span className="status-pill">🔥 {streak}</span>
          <span className="status-pill">{totalXp(practice)} XP</span>
        </div>
      </div>

      {/* the drill */}
      <motion.div key={drill.id} className="drill-card" variants={popIn} initial="hidden" animate="show">
        <div className="drill-kind">{drill.kind === "predict" ? "Predict the output" : "Write one line"}</div>
        <p className="drill-prompt">{drill.prompt}</p>

        {drill.kind === "predict" ? (
          <PredictView drill={drill} done={done} picked={picked} onPick={(i) => answerPredict(drill, i)} />
        ) : (
          <WriteLineView
            drill={drill}
            line={line}
            setLine={setLine}
            checking={checking}
            verdict={verdict}
            done={done}
            onCheck={() => checkWrite(drill)}
          />
        )}

        {done ? (
          <motion.div
            className={`drill-explain${lastCorrect === false ? " incorrect" : ""}`}
            variants={popIn}
            initial="hidden"
            animate="show"
          >
            <span className="drill-explain-mark">{lastCorrect === false ? "✕ not quite" : "✓ correct"}</span>
            {wrongPredictNote ? <p className="drill-explain-note">{wrongPredictNote}</p> : null}
            <p className={wrongPredictNote ? "drill-explain-general" : undefined}>{drill.explain}</p>
            <motion.button
              className="btn ghost"
              {...pressable}
              onClick={() => (review ? startReviewDrill(drill.id) : startDrill(active, drill.id))}
            >
              {lastCorrect === false ? "Try another →" : review ? "Next miss →" : "Next drill →"}
            </motion.button>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}

function PredictView({
  drill,
  done,
  picked,
  onPick,
}: {
  drill: PredictDrill;
  done: boolean;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <>
      {drill.code ? <pre className="drill-code">{drill.code}</pre> : null}
      <div className="drill-choices">
        {drill.choices.map((choice, i) => {
          const isAnswer = i === drill.answerIndex;
          const isPicked = i === picked;
          let cls = "drill-choice";
          if (done && isAnswer) cls += " correct";
          else if (done && isPicked && !isAnswer) cls += " wrong";
          return (
            <button key={i} className={cls} onClick={() => onPick(i)} disabled={done}>
              <code>{choice}</code>
              {done && isAnswer ? <span className="choice-mark">✓</span> : null}
              {done && isPicked && !isAnswer ? <span className="choice-mark">✕</span> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

function WriteLineView({
  drill,
  line,
  setLine,
  checking,
  verdict,
  done,
  onCheck,
}: {
  drill: WriteLineDrill;
  line: string;
  setLine: (v: string) => void;
  checking: boolean;
  verdict: { pass: boolean; reason: string } | null;
  done: boolean;
  onCheck: () => void;
}) {
  const [before, after] = drill.template.split("__LINE__");
  return (
    <>
      <pre className="drill-code">
        {before}
        <span className="drill-blank">your line ↓</span>
        {after}
      </pre>
      <input
        className="drill-input"
        value={line}
        spellCheck={false}
        onChange={(e) => setLine(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !checking && !done) onCheck();
        }}
        disabled={done}
        aria-label="Your line of Java"
      />
      {!done ? (
        <motion.button className="btn primary" {...pressable} onClick={onCheck} disabled={checking}>
          {checking ? "Compiling…" : "Check"}
        </motion.button>
      ) : null}
      {verdict && !verdict.pass ? (
        <motion.pre className="drill-verdict fail" variants={popIn} initial="hidden" animate="show">
          {verdict.reason}
        </motion.pre>
      ) : null}
    </>
  );
}
