"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import type { DerivedState } from "@/lib/animate";
import { hudTick } from "@/lib/motion";
import type { FarmState } from "@/lib/types";

// 3D island scene is client-only + heavy, so load it lazily and never on the server.
const IslandFarm = dynamic(() => import("@/components/IslandFarm"), { ssr: false });

function phaseLabel(state: DerivedState): string {
  const a = state.lastAction;
  if (!a) return "ready";
  if (a.type === "plant") return "planting";
  if (a.type === "harvest") return "harvesting";
  if (a.type === "inspect") return "reading";
  return "working";
}

// Full-bleed farm: a fixed background layer the floating windows sit on top of.
// The 3D floating-island scene is rendered on every machine (no 2D fallback) so
// the public deployment looks the same everywhere; if a browser truly cannot
// start WebGL the canvas stays empty and the CSS sky gradient shows through.
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
    <div className="farm-backdrop">
      <IslandFarm state={state} playWidth={width} playHeight={height} running={running} />

      <div className="hud left">
        {farmState.width} &times; {farmState.height} plots
      </div>

      <div className="hud right">
        <motion.div className="hud-label" key={label} variants={hudTick} initial="hidden" animate="show">
          {running ? label : "ready"}
        </motion.div>
        <div className="hud-count">
          <motion.span key={harvested} variants={hudTick} initial="hidden" animate="show" style={{ display: "inline-block" }}>
            {harvested}
          </motion.span>{" "}
          <span className="unit">crops</span>
        </div>
      </div>

      <div className="farm-vignette" />
    </div>
  );
}
