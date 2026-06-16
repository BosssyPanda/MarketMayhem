"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE } from "@/lib/motion";

// App-wide motion defaults. `reducedMotion="user"` makes every Motion component
// respect the OS "reduce motion" setting automatically; our canvas farm and the
// GSAP celebration honour the same preference via useReducedMotion().
export default function AppMotionConfig({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DURATION.standard, ease: EASE.standard }}>
      {children}
    </MotionConfig>
  );
}
