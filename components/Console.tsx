"use client";

import type { RunResponse } from "@/lib/types";

export default function ConsolePanel({ result }: { result: RunResponse | null }) {
  let body: string;
  let tone = "muted";

  if (!result) {
    body = "Press Run to execute your Strategy.";
  } else if (!result.compiled) {
    body = result.compileErrors || result.runtimeError || "Compilation failed.";
    tone = "error";
  } else if (result.runtimeError) {
    body = result.runtimeError;
    tone = "error";
  } else {
    const lines: string[] = [];
    if (result.stdout) lines.push(result.stdout.trimEnd());
    lines.push(result.objective.passed ? "✔ Objective passed!" : "✗ Objective not met yet.");
    body = lines.join("\n");
    tone = result.objective.passed ? "ok" : "warn";
  }

  return (
    <div className="panel console">
      <div className="panel-head">
        <h2>Console</h2>
      </div>
      <pre className={`console-body ${tone}`}>{body}</pre>
    </div>
  );
}
