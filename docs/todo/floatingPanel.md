# Floating Panel implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[17/08/26]

- [x] Collapse the details wrapper height alongside its transform and opacity exit.
- [x] Retarget interrupted height collapse and release the measured height when reopening settles.

[17/08/26]

- [x] Overlap width contraction with the detail exit so collapse reads as one response.
- [x] Reduce detail exit travel from eight pixels to four pixels.
- [x] Match the `120ms` collapse duration and ease-out curve across width and detail exit while preserving the preferred `160ms` expansion.

[17/08/26]

- [x] Remove width transitions so panel sizing does not animate layout properties.
- [x] Retarget interrupted detail exits from their visible transform and opacity.

[17/08/26]

- [x] Remove generic height interpolation so nested disclosure changes are immediate.
- [x] Keep the summary anchored while optional details change.
- [x] Let closing details drop and fade before the panel width contracts.

[17/08/26]

- [x] Use a compact constrained width for summary and editor presentations.
- [x] Expand to the shared content measure for detailed review content.
- [x] Morph the panel width and measured content height without scaling its contents.
- [x] Disable panel morph transitions when reduced motion is requested.

## Open product work

- None.

## Work outside the foundation scope

[17/08/26]

- A shared motion-token scale remains outside the Floating Panel implementation.

## Settled interaction decisions

[17/08/26]

- Only the explicit detail close transition animates height; nested content changes remain immediate.
- Detail height uses a one-shot element measurement rather than generic panel observation.
- Width, detail height, transform, and opacity share the same collapse duration and easing.

[17/08/26]

- Width contraction and detail exit start from the same disclosure action.
- The small floating surface may transition width to avoid a staged collapse; nested content height remains immediate.
- Detail exit travel remains subordinate to the simultaneous width change.
- Collapse responds faster than expansion and keeps paired motion on one duration and easing curve.

[17/08/26]

- Panel width changes are immediate and supersede the earlier width-morph decision.
- An interrupted detail exit returns from its visible position instead of snapping to its endpoint.

[17/08/26]

- Nested content changes do not animate the whole panel.
- Closing details leave before the expanded width contracts.
- Detail exit motion uses only transform and opacity and is removed under reduced motion.

[17/08/26]

- The compact presentation is the default.
- Detailed review content uses the expanded presentation.
- Width choices remain constrained component semantics rather than arbitrary consumer values.
- The panel stays anchored at its lower edge while its content changes size.

## Open design decisions

- None.

## Validation checklist

[17/08/26]

- [x] Run focused Floating Panel and table mutation widget tests.
- [x] Run changed-file StyleX and package lint.
- [x] Run design-system, documentation, and product typechecks and builds.
- [x] Verify continuous panel height collapse, interruption, and reduced-motion behavior.

[17/08/26]

- [x] Run focused Floating Panel and table mutation widget tests.
- [x] Run changed-file StyleX and package lint.
- [x] Run design-system, documentation, and product typechecks and builds.
- [x] Verify overlapping collapse, interruption, and reduced-motion behavior.

[17/08/26]

- [x] Run focused Floating Panel and table mutation widget tests.
- [x] Run changed-file StyleX and package lint.
- [x] Run design-system, documentation, and product typechecks and builds.
- [x] Verify immediate size changes, detail exit, interruption, and reduced-motion behavior.

[17/08/26]

- [x] Run focused Floating Panel and table mutation widget tests.
- [x] Run changed-file StyleX and package lint.
- [x] Run design-system, documentation, and product typechecks and builds.
- [x] Verify nested disclosure, detail exit, width contraction, interruption, and reduced-motion behavior.

[17/08/26]

- [x] Run focused Floating Panel and table mutation widget tests.
- [x] Run changed-file StyleX and package lint.
- [x] Run design-system, documentation, and product typechecks and builds.
- [x] Verify compact, expanded, and responsive behavior in the browser and reduced-motion behavior in styles.
