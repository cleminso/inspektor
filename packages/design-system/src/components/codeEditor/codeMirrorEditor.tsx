import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { linter } from "@codemirror/lint";
import {
  Annotation,
  Compartment,
  EditorState,
  type Extension,
  type Transaction,
} from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useId, useRef, useState } from "react";

import {
  backgroundColors,
  spatial,
  syntaxColors,
  textColors,
} from "../../tokens/semantics.stylex";
import {
  borderRadii,
  fontFamilies,
  fontSizes,
  lineHeights,
  spacing,
} from "../../tokens/value.stylex";
import { Button } from "../button/button";
import { CopyButton } from "../copyButton/copyButton";
import type { CodeEditorProps } from "./codeEditor";
import { codeEditorStyles } from "./codeEditor.styles";
import { codeEditorVars } from "./codeEditorVars.stylex";

const externalValueUpdate = Annotation.define<boolean>();
const svgNamespace = "http://www.w3.org/2000/svg";

function createFoldMarker(open: boolean): HTMLElement {
  const marker = document.createElement("span");
  const icon = document.createElementNS(svgNamespace, "svg");
  const path = document.createElementNS(svgNamespace, "path");

  marker.dataset.slot = "code-editor-fold-marker";
  marker.dataset.state = open === true ? "expanded" : "collapsed";
  marker.title = open === true ? "Fold line" : "Unfold line";

  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("viewBox", "0 0 12 12");
  path.setAttribute("d", open === true ? "m2.5 4 3.5 3.5L9.5 4" : "m4 2.5 3.5 3.5L4 9.5");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.5");
  icon.append(path);
  marker.append(icon);

  return marker;
}

function isWholeDocumentPaste(transaction: Transaction): boolean {
  if (transaction.docChanged === false || transaction.isUserEvent("input.paste") === false) {
    return false;
  }

  let changeCount = 0;
  let replacesWholeDocument = false;

  transaction.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
    changeCount += 1;
    replacesWholeDocument =
      fromA === 0 &&
      toA === transaction.startState.doc.length &&
      fromB === 0 &&
      toB === transaction.newDoc.length;
  });

  return changeCount === 1 && replacesWholeDocument;
}

const startAfterWholeDocumentPaste = EditorState.transactionFilter.of((transaction) => {
  if (isWholeDocumentPaste(transaction) === false) {
    return transaction;
  }

  return [
    transaction,
    {
      effects: EditorView.scrollIntoView(0, { y: "start" }),
      selection: { anchor: 0 },
      sequential: true,
    },
  ];
});

const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: syntaxColors["syntax-property"] },
  { tag: tags.string, color: syntaxColors["syntax-string"] },
  { tag: tags.number, color: syntaxColors["syntax-number"] },
  { tag: tags.bool, color: syntaxColors["syntax-boolean"] },
  { tag: tags.null, color: syntaxColors["syntax-constant"] },
  {
    tag: [tags.brace, tags.squareBracket, tags.separator],
    color: syntaxColors["syntax-punctuation"],
  },
]);

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: textColors["text-default"],
    fontSize: fontSizes[1],
    height: "100%",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: fontFamilies.mono,
    lineHeight: lineHeights.normal,
    overflow: "auto",
    scrollbarColor: "transparent transparent",
    scrollbarWidth: "thin",
  },
  ".cm-scroller::-webkit-scrollbar": {
    height: "6px",
    width: "6px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    backgroundColor: "transparent",
    borderRadius: "999px",
  },
  "&:hover .cm-scroller, &.cm-focused .cm-scroller": {
    scrollbarColor: `${textColors["text-muted"]} transparent`,
  },
  "&:hover .cm-scroller::-webkit-scrollbar-thumb, &.cm-focused .cm-scroller::-webkit-scrollbar-thumb": {
    backgroundColor: textColors["text-muted"],
  },
  ".cm-content": {
    caretColor: textColors["text-default"],
    minHeight: "100%",
    paddingBlock: spacing.l,
    paddingInline: spacing.m,
  },
  ".cm-line": {
    padding: "0",
  },
  ".cm-gutters": {
    backgroundColor: codeEditorVars.backgroundColor,
    borderRightWidth: 0,
    color: textColors["text-muted"],
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: spatial["control-height-xs"],
    paddingInlineEnd: spacing.xs,
    paddingInlineStart: spacing.m,
  },
  ".cm-foldGutter": {
    marginInlineEnd: spacing.xs,
  },
  ".cm-foldGutter .cm-gutterElement": {
    alignItems: "center",
    borderRadius: borderRadii.xs,
    color: textColors["text-muted"],
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    padding: 0,
    width: spatial["icon-size-m"],
  },
  ".cm-foldGutter .cm-gutterElement:hover": {
    backgroundColor: backgroundColors["bg-hover"],
    color: textColors["text-default"],
  },
  '[data-slot="code-editor-fold-marker"]': {
    alignItems: "center",
    display: "flex",
    height: spatial["icon-size-m"],
    justifyContent: "center",
    width: spatial["icon-size-m"],
  },
  '[data-slot="code-editor-fold-marker"] svg': {
    display: "block",
    height: spatial["icon-size-xs"],
    pointerEvents: "none",
    width: spatial["icon-size-xs"],
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: textColors["text-default"],
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: backgroundColors["bg-selected"],
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-tooltip": {
    backgroundColor: backgroundColors["bg-popover"],
    borderColor: syntaxColors["syntax-punctuation"],
    color: textColors["text-default"],
  },
  ".cm-diagnostic-error": {
    borderLeftColor: syntaxColors["syntax-string-special"],
  },
});

const compactEditorTheme = EditorView.theme({
  "&": {
    maxHeight: spatial["viewport-height-s"],
  },
  ".cm-scroller": {
    maxHeight: spatial["viewport-height-s"],
  },
});

const expandedIntrinsicEditorTheme = EditorView.theme({
  "&": {
    maxHeight: spatial["viewport-height-l"],
  },
  ".cm-scroller": {
    maxHeight: spatial["viewport-height-l"],
  },
});

const expandedFillEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    minHeight: 0,
  },
  ".cm-scroller": {
    minHeight: 0,
  },
});

const wrappedEditorTheme = EditorView.theme({
  ".cm-scroller": {
    overflowX: "hidden",
  },
});

const wrappedEditorExtensions: Extension = [EditorView.lineWrapping, wrappedEditorTheme];

export function hasVerticalOverflow({
  clientHeight,
  scrollHeight,
}: Pick<HTMLElement, "clientHeight" | "scrollHeight">): boolean {
  return scrollHeight > clientHeight;
}

function getPresentationExtension(
  expanded: boolean,
  layout: CodeEditorProps["layout"],
): Extension {
  if (expanded === false) {
    return compactEditorTheme;
  }

  return layout === "fill" ? expandedFillEditorTheme : expandedIntrinsicEditorTheme;
}

function formatJson(value: string): string | null {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return null;
  }
}

function createContentAttributes({
  id,
  accessibilityLabel,
  labelledBy,
  describedBy,
  disabled,
  readOnly,
  invalid,
}: {
  id: string;
  accessibilityLabel?: string;
  labelledBy?: string;
  describedBy?: string;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
}): Record<string, string> {
  const attributes: Record<string, string> = {
    id,
    role: "textbox",
    "aria-multiline": "true",
    "aria-disabled": disabled === true ? "true" : "false",
    "aria-readonly": readOnly === true || disabled === true ? "true" : "false",
    "aria-invalid": invalid === true ? "true" : "false",
    autocapitalize: "off",
    spellcheck: "false",
    translate: "no",
  };

  if (accessibilityLabel !== undefined) {
    attributes["aria-label"] = accessibilityLabel;
  }

  if (labelledBy !== undefined) {
    attributes["aria-labelledby"] = labelledBy;
  }

  if (describedBy !== undefined) {
    attributes["aria-describedby"] = describedBy;
  }

  if (disabled === true) {
    attributes.tabindex = "-1";
  }

  return attributes;
}

function FormatIcon() {
  return (
    <svg
      aria-hidden="true"
      strokeWidth={1.5}
      viewBox="0 0 16 16"
      {...stylex.props(codeEditorStyles.icon)}
    >
      <path d="M3 4h10M3 8h7M3 12h10" />
    </svg>
  );
}

function WrapIcon() {
  return (
    <svg
      aria-hidden="true"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      {...stylex.props(codeEditorStyles.icon)}
    >
      <path d="M4 7H20" />
      <path d="M4 17H9" />
      <path d="M4 12H17.5C18.8807 12 20 13.1193 20 14.5C20 15.8807 18.8807 17 17.5 17H12.5" />
      <path d="M15 15.5L12.5 17L15 18.5V15.5Z" />
    </svg>
  );
}

function PresentationIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      strokeWidth={1.5}
      viewBox="0 0 16 16"
      {...stylex.props(codeEditorStyles.icon)}
    >
      {expanded === true ? (
        <>
          <path d="m5 3 3 3 3-3M5 13l3-3 3 3" />
        </>
      ) : (
        <>
          <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
        </>
      )}
    </svg>
  );
}

export function CodeMirrorEditor({
  value,
  onValueChange,
  accessibilityLabel,
  id,
  labelledBy,
  describedBy,
  toolbarLabel,
  readOnly = false,
  disabled = false,
  invalid = false,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  layout = "intrinsic",
}: CodeEditorProps) {
  const generatedId = useId();
  const editorId = id ?? `code-editor-${generatedId}`;
  const viewportId = `${editorId}-viewport`;
  const editorParentRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const onValueChangeRef = useRef(onValueChange);
  const initialValueRef = useRef(value);
  const expandedScrollTopRef = useRef(0);
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const [lineWrapping, setLineWrapping] = useState(true);
  const [verticalOverflow, setVerticalOverflow] = useState(false);
  const [compartments] = useState(() => ({
    editable: new Compartment(),
    attributes: new Compartment(),
    wrapping: new Compartment(),
    presentation: new Compartment(),
  }));
  const isExpanded = expanded ?? uncontrolledExpanded;
  const isExpandedRef = useRef(isExpanded);
  const previousExpandedRef = useRef(isExpanded);
  const hasDisclosure = isExpanded === true || verticalOverflow === true;

  onValueChangeRef.current = onValueChange;
  isExpandedRef.current = isExpanded;

  useEffect(() => {
    const parent = editorParentRef.current;

    if (parent === null) {
      return;
    }

    const measureOverflow = (editorView: EditorView): void => {
      if (isExpandedRef.current === true) {
        return;
      }

      editorView.requestMeasure({
        read: (view) => hasVerticalOverflow(view.scrollDOM),
        write: (overflow) => {
          setVerticalOverflow(overflow);
        },
      });
    };
    const updateListener = EditorView.updateListener.of((update) => {
      const isExternalUpdate = update.transactions.some(
        (transaction) => transaction.annotation(externalValueUpdate) === true,
      );

      if (update.docChanged === true && isExternalUpdate === false) {
        onValueChangeRef.current?.(update.state.doc.toString());
      }

      if (update.docChanged === true || update.geometryChanged === true) {
        measureOverflow(update.view);
      }
    });
    const extensions: Extension[] = [
      history(),
      closeBrackets(),
      bracketMatching(),
      lineNumbers(),
      foldGutter({ markerDOM: createFoldMarker }),
      indentOnInput(),
      json(),
      linter(jsonParseLinter()),
      syntaxHighlighting(highlightStyle),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        indentWithTab,
      ]),
      editorTheme,
      startAfterWholeDocumentPaste,
      updateListener,
      compartments.editable.of([
        EditorState.readOnly.of(readOnly === true || disabled === true),
        EditorView.editable.of(readOnly === false && disabled === false),
      ]),
      compartments.attributes.of(
        EditorView.contentAttributes.of(
          createContentAttributes({
            id: editorId,
            accessibilityLabel,
            labelledBy,
            describedBy,
            disabled,
            readOnly,
            invalid,
          }),
        ),
      ),
      compartments.wrapping.of(lineWrapping === true ? wrappedEditorExtensions : []),
      compartments.presentation.of(getPresentationExtension(isExpanded, layout)),
    ];
    const editorView = new EditorView({
      doc: initialValueRef.current,
      extensions,
      parent,
    });

    editorViewRef.current = editorView;
    const resizeObserver = new ResizeObserver(() => {
      measureOverflow(editorView);
    });

    resizeObserver.observe(editorView.scrollDOM);
    resizeObserver.observe(editorView.contentDOM);
    measureOverflow(editorView);

    return () => {
      resizeObserver.disconnect();
      editorViewRef.current = null;
      editorView.destroy();
    };
  }, [compartments]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (editorView === null || editorView.state.doc.toString() === value) {
      return;
    }

    editorView.dispatch({
      annotations: externalValueUpdate.of(true),
      changes: { from: 0, to: editorView.state.doc.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (editorView === null) {
      return;
    }

    editorView.dispatch({
      effects: compartments.editable.reconfigure([
        EditorState.readOnly.of(readOnly === true || disabled === true),
        EditorView.editable.of(readOnly === false && disabled === false),
      ]),
    });
  }, [compartments, disabled, readOnly]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (editorView === null) {
      return;
    }

    editorView.dispatch({
      effects: compartments.attributes.reconfigure(
        EditorView.contentAttributes.of(
          createContentAttributes({
            id: editorId,
            accessibilityLabel,
            labelledBy,
            describedBy,
            disabled,
            readOnly,
            invalid,
          }),
        ),
      ),
    });
  }, [
    accessibilityLabel,
    compartments,
    describedBy,
    disabled,
    editorId,
    invalid,
    labelledBy,
    readOnly,
  ]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (editorView === null) {
      return;
    }

    editorView.dispatch({
      effects: compartments.wrapping.reconfigure(
        lineWrapping === true ? wrappedEditorExtensions : [],
      ),
    });
    if (lineWrapping === true) {
      editorView.scrollDOM.scrollLeft = 0;
    }
    editorView.requestMeasure({
      read: (view) => hasVerticalOverflow(view.scrollDOM),
      write: (overflow) => {
        if (isExpandedRef.current === false) {
          setVerticalOverflow(overflow);
        }
      },
    });
  }, [compartments, lineWrapping]);

  useEffect(() => {
    const editorView = editorViewRef.current;

    if (editorView === null) {
      return;
    }

    if (previousExpandedRef.current === true && isExpanded === false) {
      expandedScrollTopRef.current = editorView.scrollDOM.scrollTop;
    }

    editorView.dispatch({
      effects: compartments.presentation.reconfigure(
        getPresentationExtension(isExpanded, layout),
      ),
    });

    if (isExpanded === true) {
      editorView.scrollDOM.scrollTop = expandedScrollTopRef.current;
    } else {
      editorView.scrollDOM.scrollTop = 0;
      editorView.requestMeasure({
        read: (view) => hasVerticalOverflow(view.scrollDOM),
        write: (overflow) => {
          setVerticalOverflow(overflow);
        },
      });
    }

    previousExpandedRef.current = isExpanded;
  }, [compartments, isExpanded, layout]);

  const setExpanded = (nextExpanded: boolean): void => {
    if (expanded === undefined) {
      setUncontrolledExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded);
    if (disabled === false) {
      editorViewRef.current?.focus();
    }
  };

  const format = (): void => {
    const editorView = editorViewRef.current;

    if (editorView === null || readOnly === true || disabled === true) {
      return;
    }

    const formattedValue = formatJson(editorView.state.doc.toString());

    if (formattedValue === null) {
      return;
    }

    const { anchor, head } = editorView.state.selection.main;

    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: formattedValue },
      effects: EditorView.scrollIntoView(0, { y: "start" }),
      selection: {
        anchor: Math.min(anchor, formattedValue.length),
        head: Math.min(head, formattedValue.length),
      },
    });
    editorView.scrollDOM.scrollTop = 0;
    editorView.focus();
  };

  return (
    <div
      {...stylex.props(
        codeEditorStyles.root,
        invalid === true && codeEditorStyles.invalid,
        disabled === true && codeEditorStyles.disabled,
        readOnly === true && codeEditorStyles.readOnly,
        layout === "fill" && isExpanded === true && codeEditorStyles.rootFill,
      )}
      data-disabled={disabled === true ? "" : undefined}
      data-expanded={isExpanded === true ? "" : undefined}
      data-invalid={invalid === true ? "" : undefined}
      data-layout={layout === "fill" && isExpanded === true ? "fill" : "intrinsic"}
      data-readonly={readOnly === true ? "" : undefined}
      data-slot="code-editor"
    >
      <div
        id={viewportId}
        {...stylex.props(
          codeEditorStyles.viewport,
          isExpanded === true &&
            layout === "fill" &&
            codeEditorStyles.viewportExpandedFill,
        )}
        ref={editorParentRef}
      />

      <div {...stylex.props(codeEditorStyles.toolbar)}>
        {toolbarLabel === undefined ? null : (
          <span
            {...stylex.props(codeEditorStyles.toolbarLabel)}
            data-slot="code-editor-toolbar-label"
          >
            {toolbarLabel}
          </span>
        )}
        <Button
          aria-label="Format JSON"
          disabled={readOnly === true || disabled === true}
          onClick={format}
          shape="square"
          size="xs"
          title="Format JSON"
          variant="ghost"
        >
          <FormatIcon />
        </Button>
        <Button
          aria-label={lineWrapping === true ? "Disable line wrapping" : "Enable line wrapping"}
          aria-pressed={lineWrapping}
          disabled={disabled}
          onClick={() => {
            setLineWrapping((enabled) => enabled === false);
            if (disabled === false) {
              editorViewRef.current?.focus();
            }
          }}
          shape="square"
          size="xs"
          title={lineWrapping === true ? "Disable line wrapping" : "Enable line wrapping"}
          variant={lineWrapping === true ? "secondary" : "ghost"}
        >
          <WrapIcon />
        </Button>
        <CopyButton
          disabled={disabled}
          label="Copy JSON"
          size="xs"
          textToCopy={value}
          tooltipSide="bottom"
          variant="ghost"
        />
        {hasDisclosure === true ? (
          <Button
            aria-controls={viewportId}
            aria-expanded={isExpanded}
            aria-label={isExpanded === true ? "Collapse code editor" : "Expand code editor"}
            onClick={() => {
              setExpanded(isExpanded === false);
            }}
            shape="square"
            size="xs"
            title={isExpanded === true ? "Collapse" : "Expand"}
            variant="ghost"
          >
            <PresentationIcon expanded={isExpanded} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
