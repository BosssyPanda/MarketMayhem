import { afterEach, describe, expect, it, vi } from "vitest";

async function loadGetRunner() {
  vi.resetModules();
  return import("@/lib/runner");
}

describe("getRunner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects local and mock runners on Vercel", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");

    vi.stubEnv("FARM_BOTS_RUNNER", "local");
    await expect(async () => (await loadGetRunner()).getRunner()).rejects.toThrow(/Vercel production cannot use FARM_BOTS_RUNNER=local/i);

    vi.stubEnv("FARM_BOTS_RUNNER", "mock");
    await expect(async () => (await loadGetRunner()).getRunner()).rejects.toThrow(/Vercel production cannot use FARM_BOTS_RUNNER=mock/i);
  });

  it("allows the explicit local runner for local production verification", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv("FARM_BOTS_RUNNER", "local");

    const { getRunner } = await loadGetRunner();
    expect(getRunner().constructor.name).toBe("LocalRunner");
  });

  it("defaults production to the sandbox runner", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FARM_BOTS_RUNNER", undefined);

    const { getRunner } = await loadGetRunner();
    expect(getRunner().constructor.name).toBe("SandboxRunner");
  });
});
