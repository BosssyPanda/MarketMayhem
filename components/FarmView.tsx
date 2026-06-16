"use client";

import { motion } from "motion/react";
import PixelFarm from "@/components/PixelFarm";
import type { DerivedState } from "@/lib/animate";
import { hudTick } from "@/lib/motion";
import type { FarmState } from "@/lib/types";

function phaseLabel(state: DerivedState): string {
  const a = state.lastAction;
  if (!a) return "ready";
  if (a.type === "plant") return "planting";
  if (a.type === "harvest") return "harvesting";
  if (a.type === "inspect") return "reading";
  return "working";
}

export default function FarmView({
  width,
  height,
  farmState,
  state,
  running = false,
}: {
  width: number;
  height: number;
  farmState: FarmState;
  state: DerivedState;
  running?: boolean;
}) {
  const harvested = Object.values(state.resources).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const label = phaseLabel(state);

  return (
    <div className="panel window farm">
      <div className="win-bar">
        <div className="win-lights">
          <i />
          <i />
          <i />
        </div>
        <span className="win-title">farm.live</span>
        <span className="win-spacer" />
        <span className={`win-pill${running ? "" : " idle"}`}>{running ? "● running" : `tick ${state.tick}`}</span>
      </div>

      <div className="win-body">
        <div className="farm-stage">
          <PixelFarm width={width} height={height} state={state} farmState={farmState} running={running} />

          <div className="hud left">
            {farmState.width} &times; {farmState.height} plots
          </div>

          <div className="hud right">
            <motion.div className="hud-label" key={label} variants={hudTick} initial="hidden" animate="show">
              {label}
            </motion.div>
            <div className="hud-count">
              <motion.span key={harvested} variants={hudTick} initial="hidden" animate="show" style={{ display: "inline-block" }}>
                {harvested}
              </motion.span>{" "}
              <span className="unit">crops</span>
            </div>
          </div>

          <div className="farm-scanlines" />
          <div className="farm-vignette" />
        </div>
      </div>
    </div>
  );
}
