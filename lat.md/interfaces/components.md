# Component contracts

Reusable components preserve behavior and semantic identity while constraining visual choices. This contract owns wrapper, selection, grid, editor, and shell obligations.

## Contents

Read only the contract for the component boundary being changed.

- [Wrapper contract](#wrapper-contract)
- [ActionList selection](#actionlist-selection)
- [Data Grid presentation](#data-grid-presentation)
- [Structured value inspection](#structured-value-inspection)
- [Structured source editing](#structured-source-editing)
- [Shell geometry](#shell-geometry)

## Wrapper contract

Base UI owns widget state, registration, accessibility, focus, and popup mechanics. Inspektor owns supported modes, visible state, tokens, and standard composition.

Derive transparent wrappers from the exact upstream part. Preserve callback event details, cancellation, native props, and ref targets. Use closed allowlists for intentionally restricted geometry, not as a replacement for an upstream behavioral contract.

`render` targets receive behavioral props and the ref on the same element. `nativeButton` describes that final element; it does not choose its tag. `useRender` provides rendering composition, not a widget state machine.

Use `mergeProps` for independent handler sources. Merge refs separately. Ordinary spreads replace duplicate props; TypeScript omissions alone do not remove untyped runtime props.

Base UI state selects StyleX rules through `createStateStyleProps`. Retain both `className` and `style` output because dynamic StyleX values need CSS custom properties. Do not copy Base UI state into a second wrapper state machine.

Compound namespaces do not enforce ancestry or bind one TypeScript generic across all child calls. Preserve each part's actual runtime and type contract.

## ActionList selection

Navigation `active` and bulk-selection `checked` are independent. `SelectionControl` is a sibling of `Trigger` so interactive controls do not nest.

The consumer owns the checked set, range anchor, visible filtered order, and bulk commands. A normal selection establishes an anchor. A range extension keeps that anchor and applies the target state to the inclusive visible range.

Reveal selection controls on item hover, checkbox focus, checked state, or explicit list-wide visibility. Trigger focus alone does not reveal the checkbox. Trailing actions use their own focus state, not item `focus-within`, because an unchecked checkbox can retain focus.

`onEscapeKeyDown` receives unhandled bubbling Escape events. The consumer prevents default only when it clears selection. The list then focuses the originating item's trigger. No-op Escape preserves focus.

## Data Grid presentation

Logical table state does not determine painted geometry. Data Grid owns rendered widths, sticky surfaces, gridlines, hit areas, and state presentation.

Keep structural border widths stable. Each cell owns its trailing and bottom gridline; headers own the header separator. Separate borders avoid browser conflict resolution. Cell-local decoration follows scrolling and resizing without a measured table-wide overlay.

Backgrounds show membership or scope. Rings show the current target. Outlines show actual keyboard focus. Resize emphasis recolors the header-owned edge; the larger handle owns input, not the visible seam.

Keep active, selected, and focused states distinct. A selection range does not make every member an active target. Focus follows column identity after reordering. Preserve focus against selected backgrounds and in forced colors.

Pinned cells need opaque row surfaces and stacking above scrolling cells. Spanning rows represent one region without internal column gridlines. Staged deletion suppresses staged-update presentation for that row.

Do not place a guide from logical TanStack offsets unless those offsets equal rendered widths. Inspect shared-edge corners, sticky and pinned intersections, zoom, and combined focus states when changing presentation.

## Structured value inspection

`JsonView` is a read-only tree, separate from mutation input. It is an independent implementation informed by [Geist JSON View](https://vercel.com/geist/json-view), not reused source or package artifacts.

The tree owns expansion and keyboard navigation. Render budgets bound large values and expose continuation or terminal nodes. Application toolbars own search and whole-row copy; the tree never submits writes.

## Structured source editing

`CodeEditor` owns editable source and editor sessions. Documentation `CodeBlock` owns read-only highlighted source, copying, and disclosure. A shared interaction boolean cannot express these different contracts.

CodeMirror supplies selection, composition, history, and JSON editing without a rich-text document model. The public API stays constrained; it does not expose arbitrary extensions or highlighted HTML. Syntax semantics can be shared without sharing rendering engines.

Formatting is explicit. Compact and expanded views preserve the mounted editor session. Expansion changes viewport presentation, not source. Fill layout needs a constrained parent.

The application owns Value, NULL, and Default mutation modes. `CodeEditor.value` remains source text. Retain the non-null draft when switching modes; unavailable editing actions do not erase that draft.

Connect the editor name, invalid state, and error description to the complete field. A contenteditable textbox needs explicit label-to-focus handling. Editor-local Format, Wrap, Copy, and Expand actions stay separate from mutation modes.

CodeMirror loads lazily with a usable controlled textarea fallback. The owner can preload the engine before programmatic focus. [[importBoundaryPlaybook|Import boundaries]] owns loading and transition rules.

## Shell geometry

`ShellLayout` owns header, body, footer, optional docks, resize handles, collapse mechanics, and surface geometry. An absent dock creates neither a panel nor a handle.

The consumer owns storage adapters, migration, feature selection, hotkeys, routing, content, and page landmarks. Persistence stores geometry through that adapter; the shell does not select application features.
