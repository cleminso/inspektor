# Code Editor

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[04/08/26]

- [x] Align CodeMirror scrollbar width, thumb color, and reveal states with the shared scrollbar contract without reserving an empty gutter.

[28/07/26]

- [x] Keep editable `CodeEditor` and read-only `CodeBlock` as separate component contracts.
- [x] Select CodeMirror 6 as the editing engine.
- [x] Provide semantic syntax tokens through `syntaxColors` in `packages/design-system/src/tokens/semantics.stylex.ts`.
- [x] Keep the existing documentation `CodeBlock` application-owned and Shiki-backed.

## Open product work

[26/07/26]

- [x] Add the minimal CodeMirror 6 packages required for editor state, editor view, JSON language support, and accessibility behavior.
- [x] Implement `CodeEditor` under `packages/design-system/src/components/codeEditor/` with behavior in `codeEditor.tsx` and StyleX rules in `codeEditor.styles.ts`.
- [x] Map CodeMirror syntax highlighting to Inspector `syntaxColors` instead of shipping an unrelated editor theme.
- [x] Support controlled source text through `value` and `onValueChange`.
- [x] Support `readOnly`, `disabled`, and `invalid` states without exposing `className`, `style`, arbitrary CodeMirror extensions, or editor configuration objects.
- [x] Integrate with `Field.Root`, `Field.Label`, `Field.Description`, and `Field.Error`.
- [x] Add explicit JSON formatting without changing source while the user types.
- [x] Add JSON diagnostics with source-range information.
- [x] Add line wrapping, copying, Expand, and Collapse controls using native buttons and accessible labels.
- [x] Add content-aware compact sizing based on rendered vertical overflow with controlled expansion, `aria-expanded`, and `aria-controls`.
- [x] Keep the editor mounted while its capped presentation changes so selection, scroll position, and undo history survive Expand and Collapse.
- [x] Keep one non-overlapping toolbar with one Expand or Collapse affordance per state.
- [x] Give Wrap a visible pressed state and return focus to the editor after local presentation actions.
- [x] Format the live CodeMirror document and return selection and viewport to the document beginning.
- [x] Return whole-document paste to the document beginning.
- [x] Keep compact and expanded scroll positions separate.
- [x] Support intrinsic and constrained fill layouts without exposing styling escape hatches.
- [x] Integrate editable JSON, array, and row columns in the Table Explorer insert and update forms.
- [x] Preserve the mounted editor session and source draft when a nullable field changes between Value and NULL.
- [x] Document the component with executable examples, generated props, and a focused playground.
- [x] Export `CodeEditor` and consumer-facing types from `packages/design-system/src/index.ts`.
- [x] Load the CodeMirror editing engine through a lazy component boundary so unrelated application routes do not include it in their initial shared chunk.
- [x] Let rendered editors start the lazy CodeMirror import without an unconditional product preload.
- [x] Use native `:focus-within` styling instead of React state for the editor focus border.
- [x] Keep invalid JSON formatting as a safe no-op instead of parsing the document on every edit.
- [x] Bound programmatic focus waiting when a lazy editor does not become ready.
- [x] Preserve the active selection when formatting instead of forcing matching-bracket highlighting at the document boundary.
- [x] Show line numbers and JSON fold controls in the editor gutter.
- [x] Use the Iconoir `wrap-text` geometry for the line-wrapping action.
- [x] Support a short uppercase source label at the start of the editor toolbar.
- [x] Keep toolbar actions on the same compact button size and use consistent icon strokes.
- [x] Reveal editor scrollbars only while the editor is hovered or focused.
- [x] Replace font-dependent fold glyphs with token-sized SVG disclosure markers matching `JsonView`.
- [x] Keep wrapped content at the horizontal origin behind a state-matched opaque gutter.

[27/07/26]

- [x] Keep a controlled native textarea usable while the deferred CodeMirror implementation loads.
- [x] Share the in-flight CodeMirror module request and reset it after failure so another mount can retry.
- [x] Report CodeMirror loading failures with a component-specific message while retaining the static editor.
- [x] Restore editor focus when CodeMirror replaces the focused static textarea.
- [x] Remove product-level DOM observation used to wait for the deferred editor control.
- [x] Cover the static import boundary, loading fallback, retry behavior, and focus transition.

[29/07/26]

- [x] Prevent Format JSON from scrolling product-owned ancestor containers while returning the editor viewport to the document start.

## Work outside the foundation scope

[24/07/26]

- Replacing `apps/design-system/src/components/docs/codeBlock.tsx` is outside the initial `CodeEditor` implementation.
- Rich-text code blocks embedded in a ProseMirror document are outside the Inspector form-editor use case.
- Monaco and a custom `contenteditable` editing engine are outside the selected architecture.
- Editable languages other than JSON are outside the initial component contract.
- `CodeEditor` does not own database NULL, default-value, omission, or mutation semantics.

## Settled interaction decisions

[24/07/26]

- `CodeEditor` edits source text; `CodeBlock` presents read-only highlighted source.
- CodeMirror 6 owns text editing, selection, history, indentation, and JSON language behavior.
- The initial public language contract is JSON rather than an unrestricted language string.
- The progressive-disclosure labels are `Expand` and `Collapse`.
- Compact presentation shows enough source to communicate the value shape instead of hiding the complete editor.
- Expand and Collapse alter presentation without replacing the editor instance.
- Compact presentation begins at the document start; expanded presentation restores its independent working scroll position.
- Disclosure is based on rendered overflow rather than source line or character thresholds.
- Layout height changes are not animated.
- The field header owns schema-level value modes such as Value, NULL, and Default.
- The editor toolbar owns editor-local actions such as Format, Wrap, Copy, Expand, and Collapse.
- NULL remains explicit; a blank or disabled editor must not ambiguously represent NULL.
- Toggling NULL preserves the last non-null source draft so returning to Value restores it.
- Structured mutation fields use one compact Value/Default/NULL selector in the field header.
- NULL and Default use compact code-value presentations while the inactive editor stays mounted.

## Open design decisions

[24/07/26]

- [x] Let empty and short source use intrinsic height up to the small semantic compact cap.
- [x] Use bounded intrinsic expansion for standalone composition and fill expansion inside a constrained product pane.
- [x] Keep one disclosure affordance in the normal-flow toolbar.
- [x] Keep Format in the editor toolbar.
- [x] Treat formatting as a source-text change and therefore as a dirty mutation.
- [x] Use Value/Default/NULL for eligible insert fields and Value/NULL for nullable update fields.
- [x] Keep capped content internal to `CodeEditor` until another product surface establishes a reusable contract.

## Validation checklist

[26/07/26]

- [ ] Editing, selection, undo, redo, indentation, and IME behavior are covered.
- [x] Whole-document paste begins at the document start without duplicate controlled callbacks.
- [ ] JSON formatting and diagnostics are covered for valid, invalid, empty, and large values.
- [x] Expand and Collapse preserve the editor instance and expose correct accessibility state.
- [ ] Keyboard focus, touch, read-only, disabled, invalid, and NULL compositions are covered.
- [ ] Narrow side-pane behavior is verified without obscuring labels, errors, or form actions.
- [x] Design-system tests, generated props, typecheck, documentation build, and application integration pass.
- [x] Focused StyleX lint has no property-order warnings.
- [x] Static import does not initialize CodeMirror.
- [x] The controlled editor remains usable before CodeMirror resolves.
- [x] A failed module request is visible and retryable from another mount.
