# CLAUDE.md — working in this repo

Operational guide for Claude and other agents. **The canonical spec is
[AGENTS.md](AGENTS.md)** — read it first for *what* we're building. This file covers *how* to
work here: layout, commands, conventions, and what not to touch. [OUTLINE.md](OUTLINE.md) is
the quick overview.

## What this is

**Market Mayhem: Farm Bots** — a browser game (Next.js on Vercel) that teaches **Java** the
way *The Farmer Was Replaced* teaches Python: the player **writes real Java** to automate a
farming **drone** on **one persistent, continuously-running, tick-based farm**. Player code is
compiled and run **server-side in Vercel Sandbox**; the browser animates the farm from the
returned **frame stream** and drives a **live variable inspector**. Progress = completing
objectives that unlock abilities (no currency). See AGENTS.md §1 for the full locked-design
table.

## Current state

The repo now contains the browser-game scaffold plus a real Java engine and runner seam.
The previous **terminal** version (a single-file quiz game, `MarketMayhem.java`, + its docs)
was deleted from the working tree but is still recoverable from git history:

```bash
git show HEAD:MarketMayhem.java        # prior 1,928-line terminal game (reference only)
git show HEAD:MARKET_MAYHEM_SPEC.md    # prior spec (six-concept progression)
git show HEAD:index.html               # prior Vercel landing page (reusable as marketing)
```

Implemented so far:

- Next.js App Router shell with editor, farm view, lesson panel, inspector, controls, console,
  `/api/run`, and `/api/objectives`.
- Java engine in `engine/` with the 8 core objectives, reference solutions, persistent
  state codec, concept mastery, frame emission, and objective catalog output.
- Runner seam in `lib/runner/`: local JVM execution for development, Vercel Sandbox execution
  for production, mock fallback, static forbidden-code precheck, and TypeScript tests.

Active remaining work is frontend integration/polish and deployed Sandbox verification.

## Golden rules

- **The player only writes `Strategy.java`** (the body of one `run` method + helpers). Never
  add a workflow where the player edits the engine, objectives, or infra. (No `StudentWork.java`.)
- **AGENTS.md is the source of truth.** Keep `OUTLINE.md`, `MEMORY.md`, and this file
  consistent with it — if the curriculum/objectives, the drone/farm API + tick model, or the
  JSON contract change, update all of them.
- **Continuous, tick-based, persistent.** The program runs continuously (a `while (true)` is
  expected); actions cost ticks; the farm state persists across runs. Bound each run by a
  **tick budget** (not by forbidding loops). See AGENTS.md §6.
- **Untrusted code runs only in Vercel Sandbox** — never execute player code on the function
  host. Honor every safety rule in AGENTS.md §6 (static pre-check, no network, tick + wall +
  step caps, fresh isolation, output caps).
- **Beginner Java only** for player-facing code, starters, lessons, and examples. Respect the
  allow/forbid lists in AGENTS.md §2; searching and sorting are written **by hand** (they're
  core concepts). Recursion is for the open-ended phase only.
- **8 cores gate the rest.** The recursion & puzzles phase unlocks only after all 8 core
  concepts are mastered; mastery = consistent correct use, with adaptive recaps (AGENTS.md §3).

## Intended repo layout (once implemented)

```
/
├─ AGENTS.md  CLAUDE.md  OUTLINE.md
├─ app/
│  ├─ page.tsx              # game UI: objective+lesson, editor, animated farm, inspector, console
│  └─ api/run/route.ts      # POST /api/run → Vercel Sandbox → JSON (AGENTS.md §5)
├─ components/              # Editor, FarmView (animated grid), Inspector, LessonPanel, Console
├─ lib/                     # client types + frame-stream → animation helpers + farmState persistence
├─ engine/                  # Java engine (server-side; NEVER player-edited)
│  ├─ Direction.java  Crop.java  Tile.java
│  ├─ Farm.java  Drone.java
│  ├─ Objective.java  Objectives.java  Progress.java  Runner.java
│  ├─ Strategy.template.java   # per-objective starter
│  └─ solutions/            # reference solutions used by tests
├─ scripts/                 # engine verification helpers
├─ tests/                   # Vitest coverage for runner/UI helpers
├─ public/                  # optional landing/static assets
├─ vercel.ts                # optional Vercel config if runtime tuning is needed
└─ package.json  next.config.*  tsconfig.json
```

## Commands

```bash
# Web app
npm install
npm run dev            # Next.js dev server
npm run lint
npm run typecheck
npm run test
npm run build

# Java engine — develop/test it without the browser
npm run engine:build
npm run engine:run
npm run engine:catalog
npm run engine:verify

# Confirm no forbidden features in any sample/solution Strategy (expect no matches)
grep -nE "ArrayList|HashMap|stream\(|->|::|Collections\.|Arrays\.sort|Arrays\.binarySearch|java\.util\.Random" engine/solutions/*.java
```

Development uses `FARM_BOTS_RUNNER=local` by default so the API can compile/run Java with the
local JDK. Production should use `FARM_BOTS_RUNNER=sandbox` or the default production selector
so untrusted player code runs in Vercel Sandbox.

## Deploy

Linked Vercel project: **`marketmayhem`** (`.vercel/project.json`, gitignored). Deploy via
the `vercel:deploy` skill or `vercel` CLI. Use Node.js runtime + Fluid Compute for the
function. Production Sandbox verification may require Vercel credentials and quota.

## Definition of done

See AGENTS.md §8. In short: one persistent farm where the player writes Java and watches the
drone continuously automate it tick-by-tick with a live inspector; all 8 core concepts have
objectives that genuinely require them (hand-written search + bubble/selection sort within
budgets); mastery + adaptive recap work; the recursion & puzzles phase unlocks only after the
8 cores; lessons + hints present; clear compiler/runtime errors; sandbox-isolated execution
(a `while(true)` ends cleanly at the tick budget); reference solutions pass with no forbidden
features.

## Conventions

- TypeScript for all web code; keep components small and the animation pure (render the farm
  and inspector purely from the `frames[]` stream).
- Add an objective by adding one entry to `Objectives.java` (world setup + concept tag +
  lesson + hint ladder + objective checks + starter + unlock) and its UI metadata — nothing
  else (AGENTS.md §3). Design each objective so the intended concept is the realistic way to
  pass it.
- Beginner-readable error messages: translate `javac`/runtime errors and illegal-move /
  tick-budget endings into plain language in the console.

## Motion and Animation Rules

This project is motion-heavy. Animation is a core design system.

Use the motion-design skill before implementing any major animated feature.

Tool routing:
- Use Motion for React UI animation: hover, tap, layout, cards, panels, menus, progress bars, screen transitions.
- Use GSAP for choreographed timelines, cinematic sequences, intro/victory/level-complete moments.
- Use Rive for interactive mascot, character, and state-machine animation.
- Use LottieFiles MCP for reusable animation assets like XP bursts, badge unlocks, loading animations, icons, and reward effects.
- Use dotLottieReact to render exported .lottie assets in React.

Rules:
- Do not animate the same element/property with both Motion and GSAP.
- Put reusable timing, easing, and spring values in /src/motion.
- Every major animation must have reduced-motion behavior.
- Motion should guide attention, reward progress, and clarify game state.
- Avoid random bouncing, spinning, or excessive motion.
