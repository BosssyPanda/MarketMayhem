# Farm Bots — Outline

A browser game in the spirit of *The Farmer Was Replaced*, but you learn **Java** instead of
Python. You **write real Java code** to automate a farming **drone** on **one persistent
farm**. Your program runs **continuously** — the drone keeps farming, crops grow, and
resources pile up over time, just like TFWR. Your code is compiled and run on a server, and
the browser **animates** the farm and shows a **live variable inspector** as it runs.

> You learn by writing code that makes the farm work better. No quizzes — completing
> objectives unlocks new abilities, bigger fields, and new crops.

## What you'll learn

A **from-zero Java curriculum** that starts at the absolute basics and climbs through a full
year of material, in school order:

**variables & types → `%` and `/` → comparisons & booleans → `if`/`else` → `for` loops →
nested loops → `while` loops → 1D arrays → writing your own (static) methods**, then the
"a bit beyond" cores **sequential search → binary search → bubble sort → selection sort**, and
finally an open-ended **recursion & puzzles** phase. `String` methods and 2D arrays are woven
in as side-topics.

Two surfaces teach it:
- **26 farm objectives** — write Java to automate the drone; each objective requires its
  concept and unlocks an ability.
- **~100 practice drills** — predict-the-output (code tracing) and write-the-line
  (auto-graded), beginner-first, each with a worked-example lesson and wrong-answer
  explanations.

## How it works (one glance)

```
┌─────────────── Browser (Next.js on Vercel) ───────────────┐
│  Objective + lesson  │  Java editor (Monaco)              │
│  + Hint button       │  [ Run ▶ ]                         │
│                      │                                     │
│  Animated farm   ◀───┼── Console: compiler / runtime      │
│  (drone + crops)     │   errors + System.out              │
│  Live inspector  ◀───┼── (drone state, your watched vars, │
│                      │    resources, tick)                │
└───────┬──────────────┴─────────────────────────────────────┘
        │ POST /api/run { code, farmState }
        ▼
   Vercel Function ──▶ Vercel Sandbox (secure microVM)
                         • writes your code as Strategy.java
                         • javac + java Runner  (tick-bounded)
                         • returns JSON: frames[] + progress
        ▲                   (drone actions + state, per tick)
        └──── animate the frames + persist the farm ─────────┘
```

You write the body of one method, then it runs continuously:

```java
public class Strategy {
    public void run(Drone drone, Farm farm) {
        while (true) {              // your program keeps the drone working
            // drive, plant, harvest, search, sort...
            drone.watch("tick", farm.tick());   // surface vars to the live inspector
        }
    }
}
```

…using a small beginner-friendly API: `drone.move(Direction.EAST)`, `drone.plant(Crop.WHEAT)`,
`drone.harvest()`, `drone.scan()`, `drone.x()/y()`, `drone.watch(name, value)`;
`farm.width()/height()/tick()`, and data like `farm.crops()`, `farm.prices()`,
`farm.moisture()`. **Actions cost ticks**; crops ripen over ticks; the world keeps moving.

## The journey (one persistent farm)

Each objective teaches a concept (with a short lesson first) and unlocks an ability. The path
opens at the very beginning and follows school order (26 objectives in all):

| # | Concept | Objective(s) | Unlocks |
|---|---------|--------------|---------|
| 1 | methods (calling) | First Sprout — drive & plant your first tiles | basic planting |
| 2 | variables & types | Store the Reading · Split the Harvest | sensor readout, baskets |
| 3 | `%` and `/` | Valve Check · Decode the Code | valve cycle, code reader |
| 4 | comparisons & booleans | Ripeness Check · Threshold Flag | scanners |
| 5 | `if`/`else` | Classify the Moisture · The Field Grader | classifier, grader |
| 6 | `for` loops | The Long Rows · Sum the Row | bigger field, sensor sweep |
| 7 | nested loops | Sweep the Field · Triangular Nursery | field map, nursery grid |
| 8 | `while` loops | Harvest 'til Done · Count the Digits | irrigation, digit counter |
| 9 | 1D arrays | Stock the Stall · Field Stats · Threshold Count · Improving Scores | market + reports |
| 10 | static methods (writing) | Write a Helper · Boolean Helper · Compose Helpers | helper toolkit |
| 11 | sequential search | Find the Crop — scan for a target; index or `-1` | a crop locator |
| 12 | binary search | Fast Market — search sorted prices (low/high/mid) | fast lookup |
| 13 | bubble sort | Tidy the Stalls — bubble-sort the stalls | sorted market view |
| 14 | selection sort | Pick the Best — rank crops by value | auto-prioritize |
| → | recursion & puzzles | unlocks after all cores are mastered | special puzzle fields, growing |

## How mastery works

A concept is **mastered** by using it **correctly and consistently over time** — not a
one-off pass. If you keep getting an already-taught core concept wrong, the game **recaps**
it (re-shows the lesson + a focused mini-challenge) before moving on. The recursion/puzzle
phase opens only once all the core concepts are mastered.

## Look & feel

Cozy, **no story** — a compact automation cockpit built **just for you**. The farm is the
visual anchor, with dark code/lesson panels around it, inspired by *The Farmer Was Replaced*
without copying its assets or branding. Everything is rendered with code (no static PNG
sprites): the drone glides, crops sprout and sway, harvests pop, and unlock/progress feedback
feels permanent.

## Where the details live

- **[AGENTS.md](AGENTS.md)** — the exact, authoritative spec: full design, the drone/farm API
  + tick model, the curriculum / objectives / abilities / mastery & recap rules, the
  run/validate JSON contract, the tech stack, the beginner-Java allow/forbid lists, and the
  Sandbox security model. Build from this.
- **[CLAUDE.md](CLAUDE.md)** — how to work in this repo: layout, build/dev/validate commands,
  conventions, what not to touch.
- **[MEMORY.md](MEMORY.md)** — project history, the pivot, and the implementation roadmap.

## Status

The repo contains a working app and a full from-zero curriculum: Next.js app shell, Java
engine with **26 objectives across 14 concepts** (beginner-first, school order), persistent
state codec, local/Sandbox runner seam, reference solutions for every objective, a **~100-drill
practice hub** (predict + write-line) with lessons and wrong-answer feedback, and
Vitest/engine verification. Active focus: continuing to deepen per-concept content toward the
IBDP target and polishing the cockpit UI.
