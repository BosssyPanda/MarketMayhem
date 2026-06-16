import type { ObjectiveCatalog, RunRequest, RunResponse } from "../types";
import { LocalRunner } from "./local";
import { MockRunner } from "./mock";
import { SandboxRunner } from "./sandbox";

export interface JavaRunner {
  run(req: RunRequest): Promise<RunResponse>;
  catalog(): Promise<ObjectiveCatalog>;
}

export function getRunner(): JavaRunner {
  const mode = process.env.FARM_BOTS_RUNNER;
  if (process.env.VERCEL === "1" && (mode === "local" || mode === "mock")) {
    throw new Error(`Vercel production cannot use FARM_BOTS_RUNNER=${mode} for untrusted Java code. Use sandbox or leave FARM_BOTS_RUNNER unset.`);
  }
  if (mode === "mock") return new MockRunner();
  if (mode === "sandbox") return new SandboxRunner();
  if (mode === "local") return new LocalRunner();
  return process.env.NODE_ENV === "production" ? new SandboxRunner() : new LocalRunner();
}
