// Shared types for the run/validate contract. Mirrors AGENTS.md section 5
// (frame stream + objective + progress). Keep this in sync with engine/Runner.java.

export type Coord = [number, number];

export interface MoveAction {
  type: "move";
  dir: string;
  to: Coord;
}
export interface PlantAction {
  type: "plant";
  at: Coord;
  crop: string;
}
export interface HarvestAction {
  type: "harvest";
  at: Coord;
  crop: string;
}
export interface InspectAction {
  type: "inspect";
  reason: string;
  at: Coord;
}
export type Action = MoveAction | PlantAction | HarvestAction | InspectAction;

export interface DroneState {
  x: number;
  y: number;
  carrying: string;
}

export interface Frame {
  tick: number;
  action: Action;
  drone: DroneState;
  watch?: Record<string, number | boolean | string>;
  resources?: Record<string, number>;
}

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
}

export interface ObjectiveResult {
  id: string;
  concept: string;
  checks: CheckResult[];
  passed: boolean;
}

export interface ConceptProgress {
  correctStreak: number;
  mastered: boolean;
  failCount: number;
  recapDue: boolean;
}

export interface FarmState {
  version: number;
  currentObjectiveId: string;
  width: number;
  height: number;
  tick: number;
  tiles: FarmTile[];
  resources: Record<string, number>;
  unlocked: string[];
  concepts: Record<string, ConceptProgress>;
  stateCodec?: string;
}

export interface FarmTile {
  x: number;
  y: number;
  crop: string;
  plantedTick: number;
  ripe: boolean;
  moisture: number;
}

export interface RunRequest {
  code: string;
  farmState?: FarmState | null;
}

export interface RunResponse {
  ok: boolean;
  compiled: boolean;
  compileErrors: string;
  runtimeError: string;
  stdout: string;
  ticks: number;
  tickLimit: number;
  frames: Frame[];
  farmState: FarmState;
  objective: ObjectiveResult;
  unlocked: string[];
  newlyUnlocked?: string[];
  concepts: Record<string, ConceptProgress>;
}

export const FARM_WIDTH = 6;
export const FARM_HEIGHT = 4;

export interface ObjectiveInfo {
  id: string;
  title: string;
  concept: string;
  lesson: string;
  workedExample: string;
  hints: string[];
  starter: string;
  unlock: string;
  farmWidth: number;
  farmHeight: number;
  targetCrop: string;
  targetPrice: number;
  prices: number[];
  crops: string[];
  moisture: number[];
}

export interface ObjectiveCatalog {
  objectives: ObjectiveInfo[];
  conceptOrder: string[];
}

export const FALLBACK_OBJECTIVE: ObjectiveInfo = {
  id: "first-sprout",
  title: "First Sprout",
  concept: "methods",
  lesson: "Call drone methods in a clear sequence to move along the top row and plant wheat.",
  workedExample: "drone.moveEast();\ndrone.plant(Crop.WHEAT);\ndrone.watch(\"planted\", 1);",
  hints: ["Move east before planting.", "Plant three target tiles.", "Watch progress with drone.watch."],
  starter:
    "public class Strategy {\n" +
    "    public void run(Drone drone, Farm farm) {\n" +
    "        for (int i = 0; i < 3; i++) {\n" +
    "            drone.moveEast();\n" +
    "            drone.plant(Crop.WHEAT);\n" +
    "            drone.watch(\"planted\", i + 1);\n" +
    "        }\n" +
    "    }\n" +
    "}\n",
  unlock: "basic-planting",
  farmWidth: FARM_WIDTH,
  farmHeight: FARM_HEIGHT,
  targetCrop: "",
  targetPrice: 0,
  prices: [],
  crops: [],
  moisture: [],
};

export const FALLBACK_CATALOG: ObjectiveCatalog = {
  objectives: [FALLBACK_OBJECTIVE],
  conceptOrder: ["methods", "for-loops", "arrays", "while-loops", "sequential-search", "binary-search", "bubble-sort", "selection-sort"],
};
