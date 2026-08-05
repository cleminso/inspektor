import { Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CodeEditor } from "./codeEditor";
import { hasVerticalOverflow } from "./codeMirrorEditor";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const longJson = JSON.stringify(
  {
    alpha: 1,
    beta: 2,
    gamma: 3,
    delta: 4,
    epsilon: 5,
    zeta: 6,
    eta: 7,
    theta: 8,
    iota: 9,
  },
  null,
  2,
);

function renderOverflowingEditor(
  props: Partial<React.ComponentProps<typeof CodeEditor>> = {},
) {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(240);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(120);

  return render(
    <CodeEditor accessibilityLabel="Settings JSON" value={longJson} {...props} />,
  );
}

async function findCodeMirrorTextbox(name = "Settings JSON"): Promise<HTMLElement> {
  return waitFor(() => {
    const editor = screen.getByRole("textbox", { name });
    if (EditorView.findFromDOM(editor) === null) {
      throw new Error("CodeMirror editor is not ready");
    }

    return editor;
  });
}

describe("CodeEditor", () => {
  it("restores focus when CodeMirror replaces the static editor", async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={'{"enabled":true}'} />);

    const staticEditor = screen.getByRole("textbox", { name: "Settings JSON" });
    staticEditor.focus();

    const editor = await findCodeMirrorTextbox();

    expect(document.activeElement).toBe(editor);
  });

  it("renders a JSON textbox with its controlled source", async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={'{"enabled":true}'} />);

    const editor = await findCodeMirrorTextbox();

    expect(editor.getAttribute("aria-multiline")).toBe("true");
    expect(editor.textContent).toContain('"enabled"');
    expect(editor.textContent).toContain("true");
  });

  it("formats valid JSON through the controlled value callback", async () => {
    const onValueChange = vi.fn();

    render(
      <CodeEditor
        accessibilityLabel="Settings JSON"
        value={'{"enabled":true}'}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Format JSON" }));

    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledWith('{\n  "enabled": true\n}'),
    );
  });

  it("formats the live editor document and returns focus to it", async () => {
    const onValueChange = vi.fn();

    render(
      <CodeEditor
        accessibilityLabel="Settings JSON"
        value={'{"stale":true}'}
        onValueChange={onValueChange}
      />,
    );

    const editor = await findCodeMirrorTextbox();
    const editorView = EditorView.findFromDOM(editor);

    expect(editorView).not.toBeNull();
    editorView?.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: '{"live":true}',
      },
      selection: { anchor: 7 },
    });
    const scrollIntoView = vi.spyOn(EditorView, "scrollIntoView");
    fireEvent.click(screen.getByRole("button", { name: "Format JSON" }));

    expect(onValueChange).toHaveBeenLastCalledWith('{\n  "live": true\n}');
    expect(editorView?.state.selection.main.anchor).toBe(7);
    expect(document.activeElement).toBe(editor);
    expect(editorView?.scrollDOM.scrollTop).toBe(0);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("shows line numbers and fold controls", async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />);

    const editor = await findCodeMirrorTextbox();
    const editorRoot = editor.closest('[data-slot="code-editor"]');
    const foldMarker = await waitFor(() => {
      const marker = editorRoot?.querySelector(
        '[data-slot="code-editor-fold-marker"][data-state="expanded"]',
      );
      if (marker === null || marker === undefined) {
        throw new Error("Fold marker is not ready");
      }

      return marker;
    });

    expect(editorRoot?.querySelector(".cm-lineNumbers")).not.toBeNull();
    expect(editorRoot?.querySelector(".cm-foldGutter")).not.toBeNull();
    expect(foldMarker?.getAttribute("title")).toBe("Fold line");
    expect(foldMarker?.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 12 12");
    expect(foldMarker?.querySelector("path")?.getAttribute("d")).toBe("m2.5 4 3.5 3.5L9.5 4");
    expect(foldMarker?.querySelector("path")?.getAttribute("stroke-width")).toBe("1.5");
  });

  it("hides scrollbars until the editor is hovered or focused", async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />);

    await findCodeMirrorTextbox();
    const styles = document.head.textContent ?? "";

    expect(styles).toMatch(/scrollbar-color:\s*transparent transparent/);
    expect(styles).not.toContain("scrollbar-gutter");
    expect(styles).toContain("::-webkit-scrollbar-thumb");
    expect(styles).toContain(":hover");
    expect(styles).toContain("cm-focused");
  });

  it("shows a source label at the start of the toolbar", async () => {
    render(
      <CodeEditor accessibilityLabel="Settings JSON" toolbarLabel="JSON" value={longJson} />,
    );

    await findCodeMirrorTextbox();
    expect(screen.getByText("JSON").getAttribute("data-slot")).toBe("code-editor-toolbar-label");
  });

  it("shows the document beginning when paste replaces the whole source", async () => {
    const onValueChange = vi.fn();

    render(
      <CodeEditor
        accessibilityLabel="Settings JSON"
        value=""
        onValueChange={onValueChange}
      />,
    );

    const editor = await findCodeMirrorTextbox();
    const editorView = EditorView.findFromDOM(editor);

    expect(editorView).not.toBeNull();
    if (editorView === null) {
      return;
    }

    const scrollIntoView = vi.spyOn(EditorView, "scrollIntoView");

    editorView.scrollDOM.scrollTop = 72;
    editorView.dispatch({
      annotations: Transaction.userEvent.of("input.paste"),
      changes: { from: 0, to: editorView.state.doc.length, insert: longJson },
      scrollIntoView: true,
      selection: { anchor: longJson.length },
    });

    expect(editorView.state.selection.main.anchor).toBe(0);
    expect(editorView.state.selection.main.head).toBe(0);
    expect(scrollIntoView).toHaveBeenCalledWith(0, { y: "start" });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(longJson);
  });

  it("keeps formatting available and ignores invalid JSON", async () => {
    const onValueChange = vi.fn();

    render(
      <CodeEditor accessibilityLabel="Settings JSON" value="{" onValueChange={onValueChange} />,
    );

    const format = await screen.findByRole("button", { name: "Format JSON" });

    expect(format.hasAttribute("disabled")).toBe(false);
    fireEvent.click(format);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("uses rendered vertical overflow to decide whether disclosure is available", async () => {
    expect(hasVerticalOverflow({ scrollHeight: 120, clientHeight: 120 })).toBe(false);
    expect(hasVerticalOverflow({ scrollHeight: 121, clientHeight: 120 })).toBe(true);

    renderOverflowingEditor({ value: "short" });

    expect(await screen.findByRole("button", { name: "Expand code editor" })).toBeDefined();
  });

  it("remeasures disclosure after wrapping changes and observed resizing", async () => {
    let scrollHeight = 240;
    let clientHeight = 120;
    const resizeCallbacks: Array<() => void> = [];

    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      () => scrollHeight,
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
      () => clientHeight,
    );
    class ResizeObserverMock implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(() => {
          callback([], this);
        });
      }

      disconnect(): void {}
      observe(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);

    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />);

    expect(await screen.findByRole("button", { name: "Expand code editor" })).toBeDefined();

    scrollHeight = 120;
    clientHeight = 120;
    fireEvent.click(screen.getByRole("button", { name: "Disable line wrapping" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Expand code editor" })).toBeNull();
    });

    scrollHeight = 240;
    for (const resize of resizeCallbacks) {
      resize();
    }

    expect(await screen.findByRole("button", { name: "Expand code editor" })).toBeDefined();
  });

  it("renders one integrated disclosure action and preserves the textbox instance", async () => {
    renderOverflowingEditor();

    const editor = await findCodeMirrorTextbox();
    const expand = await screen.findByRole("button", { name: "Expand code editor" });

    expect(expand.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expand);

    expect(screen.getByRole("textbox", { name: "Settings JSON" })).toBe(editor);
    expect(screen.getAllByRole("button", { name: "Collapse code editor" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Collapse code editor" }));

    expect(screen.getAllByRole("button", { name: "Expand code editor" })).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Settings JSON" })).toBe(editor);
  });

  it("keeps compact and expanded scroll positions separate", async () => {
    renderOverflowingEditor();

    const editor = await findCodeMirrorTextbox();
    const editorView = EditorView.findFromDOM(editor);

    fireEvent.click(await screen.findByRole("button", { name: "Expand code editor" }));
    if (editorView !== null) {
      editorView.scrollDOM.scrollTop = 72;
    }
    fireEvent.click(screen.getByRole("button", { name: "Collapse code editor" }));

    expect(editorView?.scrollDOM.scrollTop).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Expand code editor" }));
    expect(editorView?.scrollDOM.scrollTop).toBe(72);
  });

  it("reports controlled presentation changes", async () => {
    const onExpandedChange = vi.fn();

    renderOverflowingEditor({ expanded: false, onExpandedChange });

    fireEvent.click(await screen.findByRole("button", { name: "Expand code editor" }));

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole("button", { name: "Expand code editor" })).toHaveLength(1);
  });

  it("exposes a constrained fill layout only while expanded", async () => {
    const { rerender } = render(
      <CodeEditor accessibilityLabel="Settings JSON" layout="fill" value={longJson} />,
    );

    const editor = await findCodeMirrorTextbox();
    const root = editor.closest('[data-slot="code-editor"]');

    expect(root?.getAttribute("data-layout")).toBe("intrinsic");

    rerender(
      <CodeEditor accessibilityLabel="Settings JSON" expanded layout="fill" value={longJson} />,
    );

    expect(root?.getAttribute("data-layout")).toBe("fill");
  });

  it("shows a visible pressed treatment for wrapping and returns focus to the editor", async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />);

    const editor = await findCodeMirrorTextbox();
    const wrap = screen.getByRole("button", { name: "Disable line wrapping" });

    expect(wrap.getAttribute("aria-pressed")).toBe("true");
    expect(wrap.getAttribute("data-pressed")).toBe("");
    expect(wrap.getAttribute("data-variant")).toBe("ghost");
    expect(wrap.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(wrap.querySelector("svg")?.getAttribute("stroke-width")).toBe("1.5");

    fireEvent.click(wrap);

    expect(screen.getByRole("button", { name: "Enable line wrapping" }).getAttribute("data-variant"))
      .toBe("ghost");
    expect(document.activeElement).toBe(editor);
  });

  it("returns wrapped content to the horizontal origin behind an opaque gutter", async () => {
    render(<CodeEditor accessibilityLabel="Settings JSON" value={longJson} />);

    const editor = await findCodeMirrorTextbox();
    const editorView = EditorView.findFromDOM(editor);
    const gutters = editor.closest(".cm-editor")?.querySelector<HTMLElement>(".cm-gutters");

    fireEvent.click(screen.getByRole("button", { name: "Disable line wrapping" }));
    if (editorView !== null) {
      editorView.scrollDOM.scrollLeft = 80;
    }
    fireEvent.click(screen.getByRole("button", { name: "Enable line wrapping" }));

    await waitFor(() => {
      expect(editorView?.scrollDOM.scrollLeft).toBe(0);
    });
    expect(getComputedStyle(gutters as HTMLElement).backgroundColor).not.toBe("transparent");
  });

  it("uses the compact toolbar size for every editor action", async () => {
    renderOverflowingEditor({ expanded: true });

    await findCodeMirrorTextbox();
    const actions = [
      screen.getByRole("button", { name: "Format JSON" }),
      screen.getByRole("button", { name: "Disable line wrapping" }),
      screen.getByRole("button", { name: "Copy JSON" }),
      screen.getByRole("button", { name: "Collapse code editor" }),
    ];

    for (const action of actions) {
      expect(action.getAttribute("data-size")).toBe("s");
    }
  });

  it("exposes read-only, disabled, and invalid states", async () => {
    const { rerender } = render(
      <CodeEditor accessibilityLabel="Settings JSON" invalid readOnly value={'{"enabled":true}'} />,
    );

    const readOnlyEditor = await findCodeMirrorTextbox();
    expect(readOnlyEditor.getAttribute("aria-readonly")).toBe("true");
    expect(readOnlyEditor.getAttribute("aria-invalid")).toBe("true");

    rerender(<CodeEditor accessibilityLabel="Settings JSON" disabled value={'{"enabled":true}'} />);

    expect(
      screen
        .getByRole("textbox", { name: "Settings JSON", hidden: true })
        .getAttribute("aria-disabled"),
    ).toBe("true");
  });
});
