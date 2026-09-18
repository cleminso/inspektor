# Code editor and code block boundaries

This document separates editable structured source in `CodeEditor` from read-only highlighted source in `CodeBlock`.

## Table of contents

The sections cover component ownership, editing and presentation, field modes, accessibility, and dependency boundaries.

- [Purpose](#purpose)
- [Component boundary](#component-boundary)
- [Editing engine](#editing-engine)
- [Syntax presentation](#syntax-presentation)
- [Capped presentation](#capped-presentation)
- [Field composition](#field-composition)
- [Nullable and default values](#nullable-and-default-values)
- [Accessibility](#accessibility)
- [Dependency boundary](#dependency-boundary)

## Purpose

This note records the design boundary between editable code fields and read-only source presentation in Inspektor.

The initial product use case is inserting and updating JSON columns in the Table Explorer side pane. Documentation source examples remain a separate read-only use case.

## Component boundary

`CodeEditor` and `CodeBlock` remain separate components because their behavioral contracts differ.

`CodeEditor` owns:

- controlled source-text editing
- editor selection and history
- JSON indentation and bracket behavior
- formatting and diagnostics
- form focus, invalid, read-only, and disabled states
- compact and expanded editor presentation

`CodeBlock` owns:

- read-only highlighted source
- browser text selection
- copying
- optional read-only progressive disclosure
- one keyboard-scrollable horizontal surface for highlighted source and its line-number gutter, while the copy action remains anchored outside that surface and the page retains vertical scroll ownership

An `interaction={false}` prop is not part of either API. It cannot distinguish editing, selection, copying, focus, disclosure, or disabled behavior. The two component names communicate the distinction directly.

## Editing engine

CodeMirror 6 is the selected editing engine for [[packages/design-system/src/studio/codeEditor/codeEditor.tsx#CodeEditor]].

The side-pane JSON field is a standalone form control, not a code node inside a rich-text document. ProseMirror would add a document schema and rich-text selection model that this field does not need. Monaco is broader and heavier than this use case requires. A custom `contenteditable` or highlighted textarea overlay would require Inspektor to recreate selection, composition, caret, scroll synchronization, and undo behavior.

The design-system wrapper exposes constrained Inspektor behavior rather than arbitrary CodeMirror extensions or configuration objects. The initial language is JSON.

## Syntax presentation

CodeMirror syntax tags map to [[packages/design-system/src/tokens/semantics.stylex.ts#syntaxColors]].

The mapping should cover JSON properties, strings, numbers, booleans, null constants, and punctuation. Theme-specific values remain behind the semantic tokens so the editor and `JsonView` share Inspektor syntax intent without sharing rendering implementations.

Formatting is a deliberate action. The editor does not rewrite source while the user types.

## Capped presentation

The compact editor follows the progressive-disclosure model demonstrated by Geist Show More and the Linear code-block treatment:

- let empty and short source use its intrinsic height
- grow populated source to the compact semantic viewport cap
- measure rendered vertical overflow after source, wrapping, and geometry changes
- provide one `Expand` or `Collapse` action in a normal-flow toolbar
- expose controlled expanded state through `aria-expanded` and `aria-controls`
- preserve the mounted editor instance while changing the viewport presentation
- keep the compact preview at the document beginning while preserving a separate expanded scroll position

Intrinsic expanded presentation remains bounded for standalone examples. Fill presentation consumes a constrained flex parent's remaining height. The Table Explorer uses fill presentation while a structured field is expanded, hides sibling fields without unmounting them, and keeps the form action footer fixed.

The editor does not animate viewport height. Layout responds directly while toolbar state uses existing button feedback.

## Field composition

The field follows the Inspektor label and suffix pattern. Its complete-row editing role aligns with [[lat.md/tableExplorerBehaviors#Table Explorer selection and pane behavior#Editing surfaces]].

- the field label appears at the start of the header
- schema-level value-mode controls remain in the field header
- the schema type, such as `JSON`, appears in the editor toolbar or inactive-value footer
- editor-local controls remain inside the editor toolbar
- descriptions and errors remain below the editor surface

Format, Wrap, Copy, Expand, and Collapse are editor-local actions. NULL and Default are not editor actions; they describe what the mutation sends.

## Nullable and default values

`CodeEditor` accepts source text and does not accept `null` as an editor value. The Table Explorer owns a value-mode state that can represent:

- Value with a JSON source draft
- NULL for nullable columns
- Default or omission when an insert flow supports a schema default

For a nullable JSON field, an always-visible Value/NULL selector belongs in the field-header action area. Insert fields with defaults add Default to the same selector. The selector must not live in the editor toolbar because these modes describe mutation intent rather than editor commands.

When NULL is selected:

- the field body presents an explicit compact `NULL` state with its schema type rather than an empty editor
- the last non-null source draft remains in application state
- the mounted editor session preserves selection, history, wrapping, diagnostics, and presentation state
- returning to Value restores that draft
- formatting and editing actions are unavailable
- field errors remain associated with the complete field

Entering Value mode without an existing structured draft seeds `{}` for JSON and row fields or `[]` for array fields. Runtime structured values are pretty-serialized when the form draft is created; user source is not rewritten while typing.

If a field supports Value, Default, and NULL, a single constrained value-mode selector is preferable to separate competing checkboxes. Insert and update flows may expose different mode sets because Default or omission is meaningful during insert but does not necessarily describe an update value.

## Accessibility

Toolbar actions use native buttons. Toggle actions such as Wrap expose `aria-pressed`. Expand and Collapse expose `aria-expanded` and identify the controlled editor viewport.

The editor receives its accessible name from `Field.Label`. Structured labels explicitly focus the CodeMirror textbox because a native label cannot activate a contenteditable `div`. Invalid state and its visible message are connected through `aria-invalid` and `aria-describedby`.

An explicit NULL presentation remains readable and focusable through the field composition even when source editing is unavailable.

## Dependency boundary

The documentation application keeps its Shiki-backed `CodeBlock`. Shiki remains appropriate for static highlighted HTML, while CodeMirror owns editable highlighting and editor behavior.

The design-system package does not accept highlighted HTML or arbitrary token renderers to force these implementations together. Shared visual consistency comes from semantic tokens and constrained component decisions rather than a shared rendering engine.

CodeMirror remains behind a lazy chunk. Table Explorer preloads that chunk when a row form mounts so programmatic field focus does not race an unfocusable loading surface.
