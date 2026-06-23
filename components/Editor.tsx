"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type MonacoEditorInstance = Parameters<OnMount>[0];
type MonacoNamespace = Parameters<OnMount>[1];

// Body-only editor — the surrounding window chrome (title bar, run, running
// pill) is provided by <GameWindow>. Keeps the locked Strategy.java wrapper
// rows so the player only edits the run-method body. `highlightLine` glows the
// line the panda is currently executing during playback (1-based, editor body).
export default function Editor({
  value,
  onChange,
  highlightLine,
}: {
  value: string;
  onChange: (v: string) => void;
  highlightLine?: number;
}) {
  const edRef = useRef<MonacoEditorInstance | null>(null);
  const monacoRef = useRef<MonacoNamespace | null>(null);
  const decoRef = useRef<ReturnType<MonacoEditorInstance["createDecorationsCollection"]> | null>(null);

  const handleMount: OnMount = (ed, monaco) => {
    edRef.current = ed;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    const ed = edRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    if (!decoRef.current) decoRef.current = ed.createDecorationsCollection([]);
    const model = ed.getModel();
    const max = model ? model.getLineCount() : 0;
    if (highlightLine && highlightLine >= 1 && highlightLine <= max) {
      decoRef.current.set([
        {
          range: new monaco.Range(highlightLine, 1, highlightLine, 1),
          options: { isWholeLine: true, className: "editor-run-line", linesDecorationsClassName: "editor-run-gutter" },
        },
      ]);
      ed.revealLineInCenterIfOutsideViewport(highlightLine);
    } else {
      decoRef.current.clear();
    }
  }, [highlightLine, value]);

  return (
    <div className="editor">
      <div className="locked-code locked-code-open" aria-label="locked Strategy.java opening wrapper">
        <span>locked</span>
        <code>public class Strategy {"{"}</code>
      </div>
      <div className="editor-shell">
        <MonacoEditor
          height="100%"
          language="java"
          theme="vs-dark"
          value={value}
          onChange={(next) => onChange(next ?? "")}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            fontFamily: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
            fontSize: 13,
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4,
            wordWrap: "on",
            renderWhitespace: "selection",
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
      <div className="locked-code locked-code-close" aria-label="locked Strategy.java closing wrapper">
        <span>locked</span>
        <code>{"}"}</code>
      </div>
    </div>
  );
}
