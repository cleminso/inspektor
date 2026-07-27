// Do not prove the final Vite output. Prove that a module import does not initialize the deferred dependency int he Vitest module graph.
// Production-build inspection remains the evidence for emitted chuncks and initial preload closure.
import { describe, expect, it, vi } from "vitest";

const codeMirrorModuleLoaded = vi.hoisted(() => vi.fn());

vi.mock("@codemirror/view", () => {
  codeMirrorModuleLoaded();

  return {};
});

import "./codeEditor";

describe("CodeEditor module boundary", () => {
  it("does not initialize CodeMirror when the static editor is imported", () => {
    expect(codeMirrorModuleLoaded).not.toHaveBeenCalled();
  });
});
