import * as stylex from "@stylexjs/stylex";
import { lazy, Suspense } from "react";

import { codeEditorStyles } from "./codeEditor.styles";

const loadCodeMirrorEditor = () => import("./codeMirrorEditor");

const LazyCodeMirrorEditor = lazy(async () => {
  const module = await loadCodeMirrorEditor();

  return { default: module.CodeMirrorEditor };
});

export type CodeEditorLayout = "fill" | "intrinsic";

export interface CodeEditorProps {
  /** Sets the source text displayed and edited by CodeMirror. */
  value: string;
  /** Runs when editing or formatting changes the source text. */
  onValueChange?: (value: string) => void;
  /** Provides an accessible name when no external label identifies the editor. */
  accessibilityLabel?: string;
  /** Sets the editor control id used by an external label. */
  id?: string;
  /** Identifies the external element that labels the editor. */
  labelledBy?: string;
  /** Identifies external description and error elements for the editor. */
  describedBy?: string;
  /** Displays a short source-type label at the start of the editor toolbar. */
  toolbarLabel?: string;
  /** Prevents source changes while preserving focus, selection, and copying. */
  readOnly?: boolean;
  /** Prevents editing and removes the editor from sequential keyboard focus. */
  disabled?: boolean;
  /** Marks the editor value as invalid. */
  invalid?: boolean;
  /** Controls whether the editor uses its expanded viewport. */
  expanded?: boolean;
  /** Sets the initial viewport presentation when expansion is uncontrolled. */
  defaultExpanded?: boolean;
  /** Runs when Expand or Collapse requests a presentation change. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Uses intrinsic sizing by default or fills a constrained parent when expanded. */
  layout?: CodeEditorLayout;
}

export function CodeEditor({
  readOnly = false,
  disabled = false,
  invalid = false,
  defaultExpanded = false,
  layout = "intrinsic",
  ...props
}: CodeEditorProps) {
  const fallbackExpanded = props.expanded ?? defaultExpanded;

  return (
    <Suspense
      fallback={
        <div
          {...stylex.props(
            codeEditorStyles.root,
            layout === "fill" && fallbackExpanded === true && codeEditorStyles.rootFill,
          )}
          aria-label="Loading code editor"
          data-slot="code-editor-loading"
          role="status"
        >
          <div {...stylex.props(codeEditorStyles.viewport)} />
        </div>
      }
    >
      <LazyCodeMirrorEditor
        {...props}
        readOnly={readOnly}
        disabled={disabled}
        invalid={invalid}
        defaultExpanded={defaultExpanded}
        layout={layout}
      />
    </Suspense>
  );
}
