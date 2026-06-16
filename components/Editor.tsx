"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { DURATION, EASE } from "@/lib/motion";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function Editor({
  value,
  onChange,
  running = false,
}: {
  value: string;
  onChange: (v: string) => void;
  running?: boolean;
}) {
  return (
    <div className="panel window editor">
      <div className="win-bar">
        <div className="win-lights">
          <i />
          <i />
          <i />
        </div>
        <span className="win-title">Strategy.java</span>
        <span className="win-spacer" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={running ? "running" : "idle"}
            className={`win-pill${running ? "" : " idle"}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: DURATION.quick, ease: EASE.standard }}
          >
            {running ? "● running" : "✎ editing"}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="win-body">
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
    </div>
  );
}
