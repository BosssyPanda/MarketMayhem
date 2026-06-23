import type { FarmState } from "@/lib/types";

export function encodeFarmState(state: FarmState | null | undefined): string {
  if (!state) return "";
  const safe = sanitizeFarmState(state);

  const rows: string[] = [];
  for (let y = 0; y < safe.height; y++) {
    const cells: string[] = [];
    for (let x = 0; x < safe.width; x++) {
      const tile = safe.tiles.find((t) => t.x === x && t.y === y);
      cells.push(`${tile?.crop ?? "NONE"}:${tile?.plantedTick ?? -1}:${tile?.moisture ?? 0}`);
    }
    rows.push(cells.join(","));
  }

  const resources = CROPS
    .map((crop) => `${crop}:${safe.resources[crop] ?? 0}`)
    .join(",");

  const concepts = Object.entries(safe.concepts)
    .map(([id, value]) => `${id}:${value.correctStreak}:${value.failCount}:${value.mastered}:${value.recapDue}`)
    .join(",");

  return [
    "version=1",
    `currentObjectiveId=${safe.currentObjectiveId}`,
    `width=${safe.width}`,
    `height=${safe.height}`,
    `tick=${safe.tick}`,
    `tiles=${rows.join("|")}`,
    `resources=${resources}`,
    `unlocked=${safe.unlocked.join(",")}`,
    `concepts=${concepts}`,
    "",
  ].join("\n");
}

// Ordered mirror of the engine registry (engine/Objectives.java). Keep this in
// lockstep: index i's objective grants OBJECTIVE_UNLOCKS[i] on pass, which is
// what lets the player reach objective i+1. New objectives MUST be added here or
// sanitizeFarmState will reset the player back to "first-sprout".
const OBJECTIVES = [
  "first-sprout",
  "store-the-reading",
  "split-the-harvest",
  "valve-check",
  "decode-the-code",
  "ripeness-check",
  "threshold-flag",
  "classify-moisture",
  "field-grader",
  "the-long-rows",
  "sum-the-row",
  "sweep-the-field",
  "field-pattern",
  "harvest-til-done",
  "count-the-digits",
  "stock-the-stall",
  "field-stats",
  "threshold-count",
  "improving-scores",
  "clamp-the-signal",
  "pass-the-tokens",
  "write-a-helper",
  "boolean-helper",
  "compose-helpers",
  "find-the-crop",
  "fast-market",
  "tidy-the-stalls",
  "pick-the-best",
  "mastery-garden",
  "recursive-factorial",
  "recursive-power",
  "grid-totals",
  "name-scan",
] as const;

const OBJECTIVE_UNLOCKS = [
  "basic-planting",      // first-sprout
  "sensor-readout",      // store-the-reading
  "basket-packer",       // split-the-harvest
  "valve-cycle",         // valve-check
  "code-decoder",        // decode-the-code
  "ripeness-scanner",    // ripeness-check
  "smart-irrigation",    // threshold-flag
  "moisture-classifier", // classify-moisture
  "auto-grader",         // field-grader
  "bigger-field",        // the-long-rows
  "sensor-sweep",        // sum-the-row
  "field-map",           // sweep-the-field
  "nursery-grid",        // field-pattern
  "irrigation",          // harvest-til-done
  "digit-counter",       // count-the-digits
  "market-stall",        // stock-the-stall
  "harvest-report",      // field-stats
  "charge-monitor",      // threshold-count
  "improvement-tracker", // improving-scores
  "signal-limiter",      // clamp-the-signal
  "token-conveyor",      // pass-the-tokens
  "pack-helper",         // write-a-helper
  "ripeness-helper",     // boolean-helper
  "yield-engine",        // compose-helpers
  "crop-locator",        // find-the-crop
  "fast-lookup",         // fast-market
  "sorted-market-view",  // tidy-the-stalls
  "auto-prioritize",     // pick-the-best
  "recursion-puzzles",   // mastery-garden
  "factorial-engine",    // recursive-factorial
  "power-engine",        // recursive-power
  "grid-reader",         // grid-totals
  "name-scanner",        // name-scan
] as const;

// The "open phase" (mastery-garden onward — recursion + stretch objectives) is
// gated on all cores mastered; the core unlocks are everything before it.
const CORE_OBJECTIVE_UNLOCKS = OBJECTIVE_UNLOCKS.slice(0, OBJECTIVES.indexOf("mastery-garden"));

const CONCEPTS = [
  "methods",
  "variables-types",
  "modulo-division",
  "comparison-operators",
  "if-else",
  "for-loops",
  "nested-loops",
  "while-loops",
  "arrays",
  "static-methods",
  "sequential-search",
  "binary-search",
  "bubble-sort",
  "selection-sort",
] as const;

const CROPS = ["NONE", "WHEAT", "CORN", "PUMPKIN", "CARROT"] as const;

const objectiveSet = new Set<string>(OBJECTIVES);
const unlockSet = new Set<string>(OBJECTIVE_UNLOCKS);
const cropSet = new Set<string>(CROPS);

export function sanitizeFarmState(state: FarmState): FarmState {
  const raw: Record<string, unknown> = isRecord(state) ? state : {};
  const width = clampInt(raw.width, 6, 1, 12);
  const height = clampInt(raw.height, 4, 1, 12);
  const tick = clampInt(raw.tick, 0, 0, 1_000_000);
  const rawTiles = Array.isArray(raw.tiles) ? raw.tiles : [];
  const tiles = rawTiles
    .map((tile) => {
      if (!isRecord(tile)) return null;
      return {
        x: clampInt(tile.x, -1, -1, width - 1),
        y: clampInt(tile.y, -1, -1, height - 1),
        crop: typeof tile.crop === "string" && cropSet.has(tile.crop) ? tile.crop : "NONE",
        plantedTick: clampInt(tile.plantedTick, -1, -1, tick),
        ripe: Boolean(tile.ripe),
        moisture: clampInt(tile.moisture, 0, 0, 100),
      };
    })
    .filter((tile): tile is FarmState["tiles"][number] => Boolean(tile))
    .filter((tile, index, all) => tile.x >= 0 && tile.y >= 0 && all.findIndex((candidate) => candidate.x === tile.x && candidate.y === tile.y) === index);

  const resources: Record<string, number> = {};
  const rawResources = isRecord(raw.resources) ? raw.resources : {};
  for (const crop of CROPS) {
    resources[crop] = clampInt(rawResources[crop], 0, 0, 999_999);
  }

  const unlocked: string[] = Array.isArray(raw.unlocked)
    ? Array.from(new Set(raw.unlocked.filter((unlock): unlock is string => typeof unlock === "string" && unlockSet.has(unlock))))
    : [];

  const concepts: FarmState["concepts"] = {};
  const rawConcepts = isRecord(raw.concepts) ? raw.concepts : {};
  for (const concept of CONCEPTS) {
    const value = rawConcepts[concept];
    if (!isRecord(value)) continue;
    const correctStreak = clampInt(value.correctStreak, 0, 0, 3);
    const failCount = clampInt(value.failCount, 0, 0, 3);
    concepts[concept] = {
      correctStreak,
      failCount,
      mastered: correctStreak >= 3 && failCount === 0,
      recapDue: failCount >= 3,
    };
  }

  const currentObjectiveId = typeof raw.currentObjectiveId === "string" && objectiveSet.has(raw.currentObjectiveId)
    ? raw.currentObjectiveId
    : "first-sprout";
  const safeCurrentObjectiveId = clampObjectiveToProgress(currentObjectiveId, unlocked, concepts);

  return {
    version: 1,
    currentObjectiveId: safeCurrentObjectiveId,
    width,
    height,
    tick,
    tiles,
    resources,
    unlocked,
    concepts,
  };
}

function clampObjectiveToProgress(
  requestedObjectiveId: string,
  unlocked: string[],
  concepts: FarmState["concepts"],
): string {
  const requestedIndex = OBJECTIVES.indexOf(requestedObjectiveId as (typeof OBJECTIVES)[number]);
  const contiguousUnlocks = countContiguousUnlocks(unlocked);
  const allCoreMastered = CONCEPTS.every((concept) => concepts[concept]?.mastered);
  const maxIndex = allCoreMastered && contiguousUnlocks >= CORE_OBJECTIVE_UNLOCKS.length ? OBJECTIVES.length - 1 : Math.min(contiguousUnlocks, CORE_OBJECTIVE_UNLOCKS.length - 1);
  const clampedIndex = Math.max(0, Math.min(requestedIndex < 0 ? 0 : requestedIndex, maxIndex));
  return OBJECTIVES[clampedIndex];
}

function countContiguousUnlocks(unlocked: string[]): number {
  const unlockedSet = new Set(unlocked);
  let count = 0;
  for (const unlock of CORE_OBJECTIVE_UNLOCKS) {
    if (!unlockedSet.has(unlock)) break;
    count++;
  }
  return count;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const value = typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : fallback;
  return Math.max(min, Math.min(max, value));
}
