import { describe, expect, it } from "vitest";
import type { FarmState } from "@/lib/types";
import { encodeFarmState } from "@/lib/runner/stateCodec";

function baseState(overrides: Partial<FarmState> = {}): FarmState {
  return {
    version: 1,
    currentObjectiveId: "first-sprout",
    width: 6,
    height: 4,
    tick: 0,
    tiles: [],
    resources: {},
    unlocked: [],
    concepts: {},
    ...overrides,
  };
}

describe("encodeFarmState", () => {
  it("ignores client stateCodec and rebuilds a sanitized state string", () => {
    const encoded = encodeFarmState(baseState({
      stateCodec:
        "version=1\ncurrentObjectiveId=mastery-garden\nwidth=999\nheight=999\ntick=999999\nunlocked=recursion-puzzles\n",
      currentObjectiveId: "not-a-real-objective",
      width: 999,
      height: -10,
      tick: -5,
      tiles: [
        { x: 999, y: 999, crop: "DRAGONFRUIT", plantedTick: -100, ripe: true, moisture: 500 },
        { x: 1, y: 0, crop: "WHEAT", plantedTick: -4, ripe: false, moisture: -20 },
      ],
      resources: {
        WHEAT: -30,
        CORN: 1_000_000_000,
        HACKED: 50,
      },
      unlocked: ["basic-planting", "root-shell", "basic-planting"],
      concepts: {
        methods: { correctStreak: 999, mastered: false, failCount: -3, recapDue: true },
        "made-up": { correctStreak: 100, mastered: true, failCount: 100, recapDue: true },
      },
    }));

    expect(encoded).toContain("currentObjectiveId=first-sprout");
    expect(encoded).toContain("width=12");
    expect(encoded).toContain("height=1");
    expect(encoded).toContain("tick=0");
    expect(encoded).not.toContain("mastery-garden");
    expect(encoded).not.toContain("DRAGONFRUIT");
    expect(encoded).not.toContain("HACKED");
    expect(encoded).not.toContain("root-shell");
    expect(encoded).not.toContain("made-up");
    expect(encoded).toContain("WHEAT:0");
    expect(encoded).toContain("CORN:999999");
    expect(encoded).toContain("unlocked=basic-planting");
    expect(encoded).toContain("methods:3:0:true:false");
  });

  it("preserves recognized objectives, tiles, unlocks, and bounded progress", () => {
    const encoded = encodeFarmState(baseState({
      currentObjectiveId: "fast-market",
      width: 8,
      height: 5,
      tick: 42,
      tiles: [
        { x: 2, y: 1, crop: "PUMPKIN", plantedTick: 10, ripe: true, moisture: 80 },
      ],
      resources: { PUMPKIN: 7 },
      // The full contiguous unlock chain (in ladder order) that legitimately
      // reaches fast-market, the 18th objective.
      unlocked: [
        "basic-planting",
        "sensor-readout",
        "basket-packer",
        "valve-cycle",
        "code-decoder",
        "ripeness-scanner",
        "smart-irrigation",
        "moisture-classifier",
        "auto-grader",
        "bigger-field",
        "sensor-sweep",
        "field-map",
        "nursery-grid",
        "irrigation",
        "digit-counter",
        "market-stall",
        "harvest-report",
        "charge-monitor",
        "improvement-tracker",
        "signal-limiter",
        "token-conveyor",
        "pack-helper",
        "ripeness-helper",
        "yield-engine",
        "crop-locator",
      ],
      concepts: {
        arrays: { correctStreak: 2, mastered: true, failCount: 3, recapDue: false },
      },
    }));

    expect(encoded).toContain("currentObjectiveId=fast-market");
    expect(encoded).toContain("width=8");
    expect(encoded).toContain("height=5");
    expect(encoded).toContain("tick=42");
    expect(encoded).toContain("PUMPKIN:10:80");
    expect(encoded).toContain("PUMPKIN:7");
    expect(encoded).toContain(
      "unlocked=basic-planting,sensor-readout,basket-packer,valve-cycle,code-decoder,ripeness-scanner,smart-irrigation,moisture-classifier,auto-grader,bigger-field,sensor-sweep,field-map,nursery-grid,irrigation,digit-counter,market-stall,harvest-report,charge-monitor,improvement-tracker,signal-limiter,token-conveyor,pack-helper,ripeness-helper,yield-engine,crop-locator",
    );
    expect(encoded).toContain("arrays:2:3:false:true");
  });

  it("clamps objective jumps when unlock progression is inconsistent", () => {
    const encoded = encodeFarmState(baseState({
      currentObjectiveId: "mastery-garden",
      unlocked: ["recursion-puzzles"],
      concepts: {
        methods: { correctStreak: 3, mastered: true, failCount: 0, recapDue: false },
      },
    }));

    expect(encoded).toContain("currentObjectiveId=first-sprout");
    expect(encoded).not.toContain("currentObjectiveId=mastery-garden");
  });

  it("ignores malformed nested tile data instead of throwing", () => {
    const encoded = encodeFarmState({
      ...baseState(),
      tiles: [null, "bad", { x: 1, y: 1, crop: "CORN", plantedTick: 0, ripe: false, moisture: 5 }] as never,
    });

    expect(encoded).toContain("CORN:0:5");
  });
});
