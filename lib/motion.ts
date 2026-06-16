// Motion tokens — the single source of truth for UI animation in the game shell.
// Personality: "Playful" (cozy farming game). One signature easing (gentle
// overshoot), a 3-step duration palette, and a handful of reusable Motion
// variants so every panel/button/number animates consistently.
//
// These power Motion (motion/react) components ONLY. The canvas farm and the
// GSAP celebration overlay read the same numbers but drive their own elements,
// so no element is ever animated by two systems at once.

import type { Transition, Variants } from "motion/react";

// Seconds — matches the motion-design duration table (Playful: 150–300ms core).
export const DURATION = {
  quick: 0.14, // button press / micro-feedback
  standard: 0.26, // panels, pills, number pops
  slow: 0.42, // window entrance, celebratory reveals
} as const;

// Cubic-bezier easing families. `signature` is the Playful overshoot used for
// entrances and pops; `standard` for on-screen moves; `exit` for dismissals.
export const EASE = {
  signature: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  exit: [0.3, 0, 1, 1] as [number, number, number, number],
} as const;

// Spring used for tactile, weighty pops (HUD counts, success ticks).
export const POP_SPRING: Transition = { type: "spring", stiffness: 520, damping: 24, mass: 0.7 };

// Panel / window entrance: rise + fade with a gentle settle. Use with a parent
// `staggerChildren` to cascade a column of panels.
export const panelEnter: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.signature },
  },
};

// Stagger container for a stack of panelEnter children.
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

// Tactile press feedback for buttons. Spread onto a motion.button.
export const pressable = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.96 },
  transition: { duration: DURATION.quick, ease: EASE.standard },
} as const;

// Pop-in for small elements that appear (chips, hints, banners).
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { ...POP_SPRING } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: DURATION.quick, ease: EASE.exit } },
};

// A changing number/value "ticks" — a quick scale pop keyed on the value so it
// re-mounts and re-animates whenever the displayed value changes.
export const hudTick: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { ...POP_SPRING } },
};

export { useReducedMotion } from "motion/react";
