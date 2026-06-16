"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getObjectiveCheckDisplay, hintLevelForObjective } from "@/lib/animate";
import { popIn, pressable } from "@/lib/motion";
import type { CheckResult, ConceptProgress, ObjectiveInfo, ObjectiveResult } from "@/lib/types";

export default function LessonPanel({
  objective,
  result,
  resultObjective,
  progress,
  unlocked,
  newlyUnlocked,
}: {
  objective: ObjectiveInfo;
  result: ObjectiveResult | null;
  resultObjective?: ObjectiveInfo | null;
  progress: ConceptProgress | undefined;
  unlocked: string[];
  newlyUnlocked?: string[];
}) {
  const [hintState, setHintState] = useState({ objectiveId: objective.id, level: 0 });
  const hintLevel = hintLevelForObjective(hintState, objective.id);

  const checkDisplay = getObjectiveCheckDisplay(objective, result, resultObjective);
  const newUnlocks = newlyUnlocked ?? [];
  const availableData = useMemo(
    () => [
      { label: "prices()", value: objective.prices.length ? `${objective.prices.length} values` : "not used" },
      { label: "crops()", value: objective.crops.length ? `${objective.crops.length} values` : "not used" },
      { label: "moisture()", value: objective.moisture.length ? `${objective.moisture.length} values` : "not used" },
    ],
    [objective.crops.length, objective.moisture.length, objective.prices.length],
  );

  return (
    <div className="panel lesson">
      <div className="lesson-top">
        <div>
          <span className="concept-pill">{objective.concept}</span>
          <h2>{objective.title}</h2>
        </div>
        <div className="lesson-status">
          <span className={progress?.mastered ? "status-pill success" : "status-pill"}>streak {progress?.correctStreak ?? 0}</span>
          <span className={progress?.recapDue ? "status-pill warn" : "status-pill"}>
            {progress?.recapDue ? "recap due" : "steady"}
          </span>
        </div>
      </div>

      <p className="lesson-text">{objective.lesson}</p>

      <section className="lesson-section">
        <div className="section-label">worked example</div>
        <pre className="example-code">{objective.workedExample}</pre>
      </section>

      <section className="lesson-section">
        <div className="section-label">objective checks</div>
        <div data-testid="current-objective-checks">
          {checkDisplay.currentChecks.length === 0 ? (
            <p className="muted small">
              {checkDisplay.hasMismatchedCompletedResult
                ? "This is the next objective. Run the strategy to populate its checks."
                : "Run the strategy to populate checks for this objective."}
            </p>
          ) : (
            <ul className="checks">
              {checkDisplay.currentChecks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </ul>
          )}
        </div>
        {checkDisplay.hasMismatchedCompletedResult && (
          <div className="completed-result" data-testid="completed-objective-checks">
            <div className="section-label">Latest result: {checkDisplay.completedTitle}</div>
            <ul className="checks">
              {checkDisplay.completedChecks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </ul>
          </div>
        )}
      </section>

      <AnimatePresence>
        {newUnlocks.length > 0 && (
          <motion.section
            className="unlock-banner"
            aria-live="polite"
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div>
              <span className="section-label">New unlock</span>
              <strong>{newUnlocks.join(", ")}</strong>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="lesson-section">
        <div className="section-label">unlocks</div>
        <div className="chip-row">
          <span className="status-pill">{objective.unlock}</span>
          {unlocked.length > 0 ? (
            unlocked.map((item) => (
              <span className="status-pill success" key={item}>
                {item}
              </span>
            ))
        ) : (
            <span className="muted small">No permanent unlocks yet.</span>
          )}
        </div>
      </section>

      <section className="lesson-section">
        <div className="section-label">mastery</div>
        <div className="insight-grid">
          <div className="insight">
            <span>correct streak</span>
            <b>{progress?.correctStreak ?? 0}</b>
          </div>
          <div className="insight">
            <span>fail count</span>
            <b>{progress?.failCount ?? 0}</b>
          </div>
          <div className="insight">
            <span>mastered</span>
            <b>{progress?.mastered ? "yes" : "no"}</b>
          </div>
          <div className="insight">
            <span>recap</span>
            <b>{progress?.recapDue ? "due" : "clear"}</b>
          </div>
        </div>
      </section>

      <section className="lesson-section">
        <div className="section-label">available data</div>
        <div className="data-list">
          {availableData.map((item) => (
            <div className="kv" key={item.label}>
              <span>{item.label}</span>
              <b>{item.value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="lesson-section">
        <div className="section-label">hints</div>
        <div className="hints">
          <AnimatePresence initial={false}>
            {objective.hints.slice(0, hintLevel).map((hint, index) => (
              <motion.p
                key={`${objective.id}-${index}`}
                className="hint"
                variants={popIn}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {hint}
              </motion.p>
            ))}
          </AnimatePresence>
          {hintLevel < objective.hints.length && (
            <motion.button
              className="btn ghost"
              {...pressable}
              onClick={() =>
                setHintState((current) => ({
                  objectiveId: objective.id,
                  level: current.objectiveId === objective.id ? current.level + 1 : 1,
                }))
              }
            >
              {hintLevel === 0 ? "Need a hint?" : "Another hint"}
            </motion.button>
          )}
        </div>
      </section>
    </div>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <li className={check.passed ? "pass" : "fail"}>
      <span className="mark">{check.passed ? "✓" : "×"}</span>
      {check.label}
    </li>
  );
}
