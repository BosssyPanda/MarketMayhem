# AGENTS.md — Farm Bots

**This file is the canonical spec — the exact thing we are building.** Any coding agent
(Claude, Codex, etc.) should be able to implement the project from this document alone. If
something here conflicts with another doc, this file wins. Operational/working notes live in
[CLAUDE.md](CLAUDE.md); a skimmable overview lives in [OUTLINE.md](OUTLINE.md); project
history + roadmap live in [MEMORY.md](MEMORY.md).

---

## 1. What we are building

A **browser** game in the spirit of *The Farmer Was Replaced*, but for learning **Java**.
The player **writes real Java code** that automates a farming **drone** on **one persistent,
continuously-running farm**. The player's code is compiled and executed **server-side inside
Vercel Sandbox**, which returns a **frame stream** (the drone's tick-by-tick actions and
state); the browser **animates** the farm and drives a **live variable inspector** from it.

Locked design (decided with the user, 2026-06-16):

| Dimension | Decision |
|-----------|----------|
| Learning mechanic | **Write & run real Java** — the player edits only `Strategy.java` |
| Execution model | **Continuous automation**, **tick-based** — the program runs continuously; actions cost ticks; crops grow over ticks; resources accumulate |
| World structure | **One persistent farm** — a single ever-running farm; objectives unlock abilities/areas/crops; concepts are introduced as the next objective requires them |
| Progression | **Objectives unlock abilities** — no currency/economy; beating an objective permanently unlocks a new ability, area, crop, or speed |
| Teaching support | **Concept lessons** (short lesson + worked example before a concept's first use) **+ progressive hints** when stuck. **No** AI tutor |
| Curriculum | **from-zero, school-order concept ladder** (below) — each concept mastered through play; then an **open-ended phase** focused on **recursion & puzzles** that keeps growing |
| Mastery | **Consistent correct use over time** (a streak), with **adaptive recaps** if an already-taught core keeps failing |
| Debugging UX | **Live variable inspector** (drone state + player-watched variables + resources, updating as the program runs) |
| Aesthetic | **Clean, programmatically-rendered animated grid** (Canvas/SVG + CSS tweens; no PNG sprite assets) |
| Narrative | **None** — cozy automation sandbox |
| Audience | **Just the user** — single learner; no multiplayer / stranger-onboarding |

**Hard rule:** the player **only ever writes the body of `Strategy`** (one `run` method,
plus their own helper methods). The player never edits the engine, the world, the objectives,
or any infrastructure.

### The concept ladder (must each be mastered)

A **from-zero, school-order** ladder of **14 core concepts** (expanded 2026-06 from the
original 8 so a total beginner can start at the very beginning and prep for IBDP):

1. **methods (calling)** 2. **variables & types** 3. **`%` and `/`** 4. **comparisons &
booleans** 5. **`if`/`else`** 6. `for` loops 7. **nested loops** 8. `while` loops
9. arrays (1D) 10. **static methods (writing your own)** 11. **sequential search**
12. **binary search** 13. **bubble sort** (lighter core) 14. **selection sort** (lighter core)

Woven in as side-topics: `String` methods and 2D arrays.
**After all core concepts are mastered**, the **open-ended phase** unlocks, focused on
**recursion & logic puzzles**, and may keep expanding over time.

---

## 2. The player-facing Java API

The player writes:

```java
public class Strategy {
    public void run(Drone drone, Farm farm) {
        // Player code. Typically a continuous loop, e.g.:
        // while (true) { ... drive, plant, harvest ... }
        // Each drone action below advances the simulation by its tick cost.
        // The session ends when this method returns OR the tick budget runs out.
    }
}
```

Only the contents of `Strategy.java` come from the player. Everything below is provided by
the engine and is read-only to the player.

### Tick model (important)

The world advances in discrete **ticks**. Drone **actions are blocking and cost ticks** —
calling them advances simulation time, ages/grows crops, and records a frame. Sensors are
free (0 ticks). Example costs (tunable; keep consistent across engine + UI):

| Action | Tick cost |
|--------|-----------|
| `move(...)` | 1 |
| `plant(...)` / `harvest()` | 2 |
| `scan()`, `x()`, `y()`, all `farm.*` queries, `watch(...)` | 0 (free sensors) |

Crops planted now become ripe after a crop-specific number of ticks. The drone may loop
forever (`while (true)`) — the **per-run tick budget** (§6) bounds each session, and farm
state persists across runs so the farm genuinely progresses "over time."

### `Drone` — the thing the player controls (records every action into the frame stream)

| Member | Returns | Effect |
|--------|---------|--------|
| `move(Direction d)` | `void` | Move one tile (costs ticks). Moving off the field is an illegal action → clear runtime error. |
| `moveNorth()/moveSouth()/moveEast()/moveWest()` | `void` | Convenience wrappers over `move`. |
| `x()` / `y()` | `int` | Current column / row (0-based; free sensor). |
| `plant(Crop c)` | `void` | Plant crop `c` on the current tile (must be empty soil). |
| `harvest()` | `Crop` | Harvest the current tile if ripe; returns the crop or `Crop.NONE`. |
| `scan()` | `Tile` | Read-only info about the current tile (free sensor). |
| `watch(String name, int value)` | `void` | Surface a variable into the **live inspector** (free; e.g. `drone.watch("i", i)`). Overloads for `double`/`boolean`/`String`. |

### `Farm` — read-only world + per-objective data

| Member | Returns | Meaning |
|--------|---------|---------|
| `width()` / `height()` | `int` | Field dimensions (can grow as abilities unlock). |
| `tileAt(int x, int y)` | `Tile` | Read-only tile info at a coordinate. |
| `tick()` | `int` | Current world tick. |
| `crops()` | `String[]` | Crop names along a row/region (parallel with `prices()`). *Populated when relevant.* |
| `prices()` | `int[]` | Market prices; **sorted ascending** on binary-search objectives. *Populated when relevant.* |
| `moisture()` | `int[]` | Per-column moisture readings. *Populated when relevant.* |
| `signal()` | `int[]` | **Editable workbench array** — returns the *backing* array (not a copy), so `signal()[i] = x` modifies it in place. Used by array-modification objectives (clamp, shift/rotate). Seeded per objective; reset each run. *Populated when relevant.* |
| `grid()` | `int[][]` | A 2D grid (read-only copy) for the 2D-array objective; read with `grid()[row][col]`. *Populated when relevant.* |

> Data accessors return an empty array when the current objective doesn't use them; each
> objective's briefing states which data is available. Abilities are queried via
> `farm` too (e.g. unlocked sensors); locked features simply aren't available yet.

### Enums and `Tile`

- `enum Direction { NORTH, SOUTH, EAST, WEST }`
- `enum Crop { NONE, WHEAT, CORN, PUMPKIN, CARROT }` (more unlock over time)
- `Tile` (read-only): `Crop crop()`, `boolean ripe()`, `int moisture()`.

### Allowed standard Java (player)

`int double boolean char String`, 1D/2D arrays, `for`, `while`, `if`/`else`, helper methods
inside `Strategy`, `Math.*`, `String` methods, `System.out.println` (shown in the console),
recursion (open-ended phase), and the API above.

### Forbidden in player code (carried over from the prior version; enforced — see §6)

`ArrayList`, `HashMap`/`Map`/`Set`/any `java.util.Collection`, streams, lambdas, method
references, `Arrays.sort`, `Arrays.binarySearch`, `Collections.*`, `java.util.Random`, file
I/O, networking, reflection, `Thread`/concurrency, `System.exit`, and any `import` beyond
what the engine pre-supplies. **Searching and sorting must be written by hand** (that's the
whole point of the search/sort cores).

---

## 3. Curriculum: objectives, abilities, mastery & recap

There is **one persistent farm**. Progress is a sequence of **objectives** woven into that
farm. Each objective is tagged with a **primary concept**, teaches it via a lesson, and on
completion **unlocks an ability**. Objectives are **designed so the intended concept is the
realistic way to pass** (e.g. a binary-search objective caps comparisons below what a linear
scan needs; sort objectives check correct ordering within a budget) — so completing them is
evidence of real understanding.

### Concept → objective → unlock (suggested order; tunable)

33 objectives across the 14-concept ladder plus an open stretch phase (beginner-first; the
earliest ones are pure compute-and-`watch`, no drone driving). Representative objectives per
concept:

| # | Concept (core) | Objective(s) | Unlocks (sample) |
|---|----------------|--------------|---------|
| 1 | methods (calling) | **First Sprout** — drive a path and plant | basic planting + starter field |
| 2 | variables & types | **Store the Reading** · **Split the Harvest** (`int` vs `double` `/`) | sensor readout, baskets |
| 3 | `%` and `/` | **Valve Check** · **Decode the Code** (digit extraction) | valve cycle, code reader |
| 4 | comparisons & booleans | **Ripeness Check** (`&&`) · **Threshold Flag** (`||` `!`) | scanners |
| 5 | `if`/`else` | **Classify the Moisture** (bands) · **The Field Grader** (else-if + decision) | classifier, grader |
| 6 | `for` loops | **The Long Rows** (drive a row) · **Sum the Row** (accumulate) | bigger field, sensor sweep |
| 7 | nested loops | **Sweep the Field** (grid) · **Triangular Nursery** (inner depends on outer) | field map, nursery grid |
| 8 | `while` loops | **Harvest 'til Done** · **Count the Digits** (`% 10` / `/ 10`) | irrigation, digit counter |
| 9 | arrays (1D) | **Stock the Stall** · **Field Stats** (sum/avg/max+index) · **Threshold Count** · **Improving Scores** (adjacent compare + conditional sub-range avg) | market + reports |
| 10 | static methods (writing) | **Write a Helper** · **Boolean Helper** · **Compose Helpers** (helper in a loop) | helper toolkit |
| 11 | sequential search | **Find the Crop** — index or `-1`; count comparisons | a crop locator |
| 12 | binary search | **Fast Market** — sorted `prices()` (low/high/mid); budgeted | fast lookup |
| 13 | **bubble sort** (light) | **Tidy the Stalls** — bubble-sort into order | sorted market view |
| 14 | **selection sort** (light) | **Pick the Best** — rank crops by value | auto-prioritize |
| — | **open stretch phase** (unlocks after all cores mastered) | **Mastery Garden** (recursion) · **Recursive Factorial** · **Recursive Power** · **Grid Totals** (2D arrays) · **Scan the Names** (String methods) | special fields; keeps growing |

> Adding an objective = one entry in `engine/Objectives.java` (world setup + concept tag +
> lesson + hints + objective checks in `Objective.evaluate` + starter + unlock + a reference
> solution in `engine/solutions/<id>.java`) **and** — because the client mirrors the engine
> progression — append it (in registry order) to `OBJECTIVES`/`OBJECTIVE_UNLOCKS` in
> `lib/runner/stateCodec.ts` (else `sanitizeFarmState` resets it to `first-sprout`) and to
> `FALLBACK_CATALOG.conceptOrder` in `lib/types.ts` if it introduces a new concept.

### Mastery (consistent correct use over time)

Per concept, the engine tracks a `correctStreak` and a `failCount`:

- Passing an objective tagged with the concept (and, where relevant, later re-using it
  correctly) increments `correctStreak`. A concept is **mastered** when it has been used
  **correctly and consistently** — `correctStreak ≥ 3` with no recent attributable failure
  (not a single one-off pass).
- The **open-ended phase (recursion & puzzles) unlocks only when all 8 cores are mastered.**

### Adaptive recap (the "if they keep getting it wrong, recap" rule)

- A failure attributable to a concept increments that concept's `failCount` and resets its
  streak.
- If an **already-introduced core concept** accumulates repeated failures (e.g. `failCount ≥ 3`),
  the game **interrupts to recap it** — re-shows that concept's lesson and a short, focused
  mini-challenge — **even if play has moved on to later concepts.** Passing the recap clears
  the failure count and resumes normal progression.

---

## 4. Architecture

### 4.1 Components

- **Frontend** — Next.js (App Router) + TypeScript on Vercel.
  - **Monaco** editor configured for Java (the `Strategy` body).
  - **FarmView** — a clean, **programmatically rendered animated grid** (Canvas or SVG + CSS
    tweens; **no PNG sprite assets**): the drone glides between tiles, crops sprout/grow/sway,
    harvests pop. Renders purely from the frame stream.
  - **Inspector** — live variable inspector: drone position/state, player `watch(...)`
    values, resources, and current tick, updating as frames replay.
  - **LessonPanel / Hints** — the current objective's lesson + worked example, and a
    progressive **Hint** button.
  - **Console** — compiler errors, runtime errors, and `System.out` output (beginner-readable).
- **Run API** — Vercel Function at `app/api/run/route.ts` (Node.js runtime, Fluid Compute):
  takes the player's code + persistent farm state, runs a bounded **session** in Vercel
  Sandbox, returns the frame stream + updated state + progress (§5).
- **Vercel Sandbox** — secure Firecracker microVM that compiles & runs the untrusted player
  code (real `javac`/`java`).
- **Persistent farm state** — the farm carries across runs so the farm progresses "over
  time." Persist client-side (e.g. `localStorage`) and/or send round-trip in the request;
  this is a single-user game, so simple local persistence is fine.
- **Java engine** — server-side Java in `engine/`, **never edited by the player**.

### 4.2 The Java engine (`engine/`)

| File | Responsibility |
|------|----------------|
| `Direction.java`, `Crop.java` | Enums. |
| `Tile.java` | Read-only tile view. |
| `Farm.java` | The world: 2D grid, dimensions, tick, per-objective data, unlocked abilities; read-only to the player. |
| `Drone.java` | Player-controlled actor: position; `move/plant/harvest/scan/watch`; **advances ticks**, **ages/grows crops**, and **emits a frame** per action; enforces the per-run **tick budget** + hard step cap; throws clear errors on illegal moves. |
| `Objective.java` | One objective: id, title, primary concept, world setup, lesson text, hint ladder, objective checks, starter snippet, unlock. |
| `Objectives.java` | Ordered registry of all objectives. |
| `Progress.java` | Per-concept `correctStreak`/`failCount`, mastery, recap triggers, unlocked abilities. |
| `Runner.java` | `main`: load persistent state + current objective → build `Farm`/`Drone` → instantiate `Strategy` → call `run` (guarded by try/catch + tick budget) → evaluate objective checks + update progress → print **one line of JSON** (§5). |
| `Strategy.java` | The player's code (the only file swapped per run); `Strategy.template.java` provides per-objective starters. |
| `solutions/` | Reference solutions per objective — used by tests to confirm checks pass and that no forbidden features are needed. |

The engine writes JSON by hand (small helper) to stay dependency-free in the Sandbox. The
forbidden list in §2 applies to **player** code, not engine code.

### 4.3 Run flow (request → animation)

1. Browser `POST /api/run` with `{ code, farmState }`.
2. Function runs a **static pre-check** on `code` (reject forbidden tokens — §6). On failure,
   return immediately with `compiled: false`; never reach the JVM.
3. Function opens a Vercel Sandbox; writes `engine/*.java` + the player's `code` as
   `Strategy.java` + the serialized `farmState`.
4. Sandbox: `javac *.java` → on success `java Runner` (under wall-clock + tick + step caps).
5. Capture `javac` stderr, program stdout (Runner's JSON + player prints), and stderr.
6. Function returns the response (§5); browser animates `frames[]`, updates the inspector,
   shows objective/mastery progress and any unlocks, and persists the new `farmState`.

---

## 5. Run / validate contract

**Request** — `POST /api/run`

```json
{ "code": "public class Strategy { ... }", "farmState": { /* persisted farm, omit on first run */ } }
```

**Response**

```json
{
  "ok": true,
  "compiled": true,
  "compileErrors": "",
  "runtimeError": "",
  "stdout": "",
  "ticks": 240,
  "tickLimit": 5000,
  "frames": [
    {
      "tick": 1,
      "action": { "type": "move", "dir": "EAST", "to": [1, 0] },
      "drone": { "x": 1, "y": 0, "carrying": "NONE" },
      "watch": { "i": 0, "count": 3 },
      "resources": { "WHEAT": 12 }
    },
    {
      "tick": 3,
      "action": { "type": "plant", "at": [1, 0], "crop": "WHEAT" },
      "drone": { "x": 1, "y": 0, "carrying": "NONE" },
      "watch": { "i": 1, "count": 3 }
    }
  ],
  "farmState": { "...": "updated persistent farm to carry into the next run" },
  "objective": {
    "id": "the-long-rows",
    "concept": "for-loops",
    "checks": [ { "id": "row-planted", "label": "Plant every tile in row 0", "passed": true } ],
    "passed": true
  },
  "unlocked": ["bigger-field"],
  "concepts": {
    "for-loops": { "correctStreak": 3, "mastered": true, "failCount": 0, "recapDue": false }
  }
}
```

- `frames[]` is the **single source of truth** for both the animation and the live inspector:
  each frame carries the `action`, the `drone` state, the player's `watch` values, and
  (optionally) `resources`, all at a given `tick`.
- `runtimeError` is non-empty if the code threw, made an illegal move, or hit the tick/step
  cap — described in beginner-friendly terms.
- `objective.passed` + `concepts` drive unlocks, mastery, and recap decisions.

The **Runner** (Java) prints exactly one JSON line carrying `frames`, `objective`,
`concepts`, `unlocked`, `farmState`, `ticks`. The function wraps it with
`compiled`/`compileErrors`/`runtimeError`/`ok`.

---

## 6. Security & safety (running untrusted code)

The player's Java is untrusted, and `while (true)` is **expected** (continuous automation).
Defense in depth:

1. **Static pre-check (function host):** reject the forbidden tokens from §2 before compiling.
2. **Isolation:** player code compiles and runs **only inside Vercel Sandbox**, never on the
   function host.
3. **No network:** disable Sandbox egress.
4. **Bounded session, not "no infinite loops":** each run simulates up to a **tick budget**
   (e.g. ~5,000 ticks) and a wall-clock timeout (e.g. ~10s); a **hard statement/step cap**
   (e.g. ~1,000,000) is a final safety net against tight non-action loops. Hitting a cap ends
   the session cleanly with a clear message — it is not a crash.
5. **Output caps:** truncate `stdout`/stderr and cap `frames[]` length (downsample if huge).
6. **Fresh isolation per run:** never reuse a Sandbox's mutable runtime across requests;
   only the explicit serialized `farmState` carries forward.
7. **Restricted classpath:** compile player code against only the engine classes + a minimal
   JDK surface, so forbidden APIs fail to compile where feasible.

(All numbers above are tunable; keep the engine tick budget and the function timeout
consistent.)

---

## 7. Tech stack & conventions

- **Next.js** App Router + **TypeScript**; **Node.js runtime** for the API route (Fluid
  Compute). Configure with **`vercel.ts`** (preferred over `vercel.json`).
- **Vercel Sandbox** (`@vercel/sandbox`) for code execution. Provision a **JDK** (e.g.
  Temurin) in the sandbox — **confirm the JDK install/runtime image during implementation**.
- **Monaco** editor for Java; **Canvas or SVG + CSS** for the animated grid — **no static
  PNG sprite assets** (procedural shapes + tweened transitions so the farm feels alive and
  is cheap to build).
- **Single-user persistence**: `localStorage` (and/or request round-trip) for `farmState` and
  progress — no accounts, no database needed.
- Keep beginner Java front-and-center: starter code, lessons, hints, and error messages use
  only concepts unlocked so far. No story/narrative chrome.
- The prior terminal version + its docs are recoverable from git (`git show HEAD:<file>`);
  the beginner-Java constraints, the forbidden list, and the original six-concept progression
  came from there.

---

## 8. Definition of done (the game)

- A single persistent farm where the player writes Java, hits **Run**, and watches the drone
  **continuously** automate it tick-by-tick, with the **live inspector** updating live.
- All 8 core concepts have objectives that genuinely **require** the concept (hand-written
  sequential search, real low/high/mid binary search, real bubble & selection sort within
  budgets), each unlocking a concrete ability.
- **Mastery** tracks consistent correct use; **recap** resurfaces a core concept after
  repeated failures; the **recursion & puzzles** open-ended phase unlocks only after all 8
  cores are mastered.
- **Lessons + progressive hints** are present for each concept; the **live variable
  inspector** works; compiler/runtime errors are beginner-readable.
- Untrusted code cannot escape the Sandbox, reach the network, or hang the function; a
  `while (true)` program ends cleanly at the tick budget.
- Reference solutions in `engine/solutions/` pass every objective with **no** forbidden
  features.

> Build steps (scaffold Next.js, write the engine, wire the Sandbox function, deploy) are the
> implementation work that follows these docs — see [CLAUDE.md](CLAUDE.md) and the roadmap in
> [MEMORY.md](MEMORY.md).
