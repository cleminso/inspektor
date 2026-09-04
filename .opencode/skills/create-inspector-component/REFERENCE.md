# Base UI wrapper decision register

## Table of contents

- [Contract model](#contract-model)
- [Settled decisions](#settled-decisions)
- [Per-part decisions](#per-part-decisions)
- [Reference map](#reference-map)
- [Completion checklist](#completion-checklist)

## Contract model

Inspector wrappers are behaviorally transparent to Base UI by default and visually closed. Base UI owns interaction, accessibility behavior, state, and generated DOM contracts. Inspector owns presentation and any additional semantic design decisions.

Evaluate every capability on four independent axes:

1. Internal preservation: whether Base UI continues to own it.
2. Public exposure: whether consumers can configure it.
3. Type derivation: whether its public type comes from Base UI, React, or Inspector.
4. Transformation: whether Inspector renames, combines, constrains, consumes, or injects it.

Classify each difference as a preserved Base UI contract, intentional Inspector constraint, Inspector extension, accidental divergence, or per-component decision.

## Settled decisions

| Decision | Answer | Reason |
| --- | --- | --- |
| Preserve Base UI behavior and generated accessibility | Yes | Base UI is the behavioral foundation |
| Preserve the Base UI prop surface by default | Yes | Wrappers remain behaviorally transparent |
| Expose `className` | No | Inspector is the presentation source of truth |
| Expose `style` | No | Arbitrary values bypass tokens and variants |
| Expose refs on rendered Base UI parts | Yes | Focus, measurement, composition, and integration require the DOM target |
| Preserve Base UI event signatures | Yes | Event reasons, cancellation, and propagation remain available |
| Preserve ARIA and DOM props inherited from Base UI | Yes | Behavioral transparency includes native interoperability |
| Preserve Base UI-generated state attributes | Yes | They are part of the primitive's observable state contract |
| Expose `render` on every part | No | Composition is explicit by part role |
| Expose `render` on behavioral endpoints | Yes | Triggers and interactive leaves need single-element composition |
| Add `asChild` | No | Base UI composition uses `render` |
| Introduce Inspector props speculatively | No | Each extension needs a concrete system decision |
| Inventory all state, attributes, and CSS variables | Yes | Capabilities remain discoverable beside the implementation |

## Per-part decisions

Classify every wrapped part before defining props:

| Part role | Ref | `render` | Typical examples |
| --- | --- | --- | --- |
| Provider or non-DOM root | Not applicable | No | Provider, state-only Root |
| Structural part | Preserve if rendered | Usually no | Portal, Positioner, Popup, Separator |
| Behavioral endpoint | Preserve | Yes | Button, Trigger, Close |
| Semantic endpoint | Preserve | Prefer a dedicated part; otherwise yes | Item and LinkItem |
| High-level composition | Only for an identified capability | Usually no | Search, composed field |

Start from the full Base UI part type. Omit:

- `className` and `style`
- `render` unless the part classification permits it
- Base UI props fixed internally by Inspector
- Base UI props transformed or replaced by Inspector
- names that collide with Inspector-owned semantic props

Every omission beyond `className` and `style` needs a rationale in the component audit.

## Reference map

- [Base UI contract](references/baseUiContract.md): evidence hierarchy and preservation boundaries.
- [Public API policy](references/publicApiPolicy.md): inheritance, omissions, transformations, and Inspector props.
- [Ref forwarding](references/refForwarding.md): external, internal, and behavioral ref flow.
- [Render composition](references/renderComposition.md): element composition, semantic substitution, and part classification.
- [StyleX integration](references/stylexIntegration.md): state callbacks, capability inventories, focus indicators, variables, and contextual styles.
- [Component audit](references/componentAudit.md): manual audit template.
- [Testing matrix](references/testingMatrix.md): proof required for each wrapper decision.

## Completion checklist

- Installed Base UI version, API reference, handbook, and tagged source inspected
- Every wrapped part classified
- Base UI anatomy and default semantics preserved
- Public prop inheritance and omissions recorded
- `className` and `style` omitted
- Refs and events preserved
- `render` exposed only where justified
- Inspector props have a requirement, constrained type, literal default, and mapping
- State, data attributes, transition states, and CSS variables inventoried
- Every keyboard or programmatic focus target has a visible, unclipped indicator with sufficient adjacent-color contrast
- Composite widgets expose one sequential entry point and retain a visible current item in forced-colors mode
- Inspector behavior and contract tested without duplicating Base UI internals
- Package exports, generated API metadata, and component documentation complete
- Package and documentation validation pass
