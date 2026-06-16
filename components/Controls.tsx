"use client";

import { motion } from "motion/react";
import { pressable } from "@/lib/motion";
import type { ObjectiveInfo } from "@/lib/types";

export default function Controls({
  onRun,
  onResetCurrent,
  onResetFarm,
  running,
  objective,
}: {
  onRun: () => void;
  onResetCurrent: () => void;
  onResetFarm: () => void;
  running: boolean;
  objective: ObjectiveInfo;
}) {
  return (
    <div className="controls">
      <div className="controls-meta">
        <span className="section-label">current objective</span>
        <strong>{objective.title}</strong>
        <span className="muted small">{objective.concept}</span>
      </div>
      <div className="controls-actions">
        <motion.button className="btn ghost" onClick={onResetCurrent} disabled={running} {...pressable}>
          Reset code
        </motion.button>
        <motion.button className="btn ghost" onClick={onResetFarm} disabled={running} {...pressable}>
          Reset farm
        </motion.button>
        <motion.button className="btn run" onClick={onRun} disabled={running} {...pressable}>
          {running ? "Running..." : "Run"}
        </motion.button>
      </div>
    </div>
  );
}
