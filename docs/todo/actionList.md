# Action List implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[29/07/26]

- [x] Keep selection controls, primary triggers, and trailing actions as separate interactive elements.
- [x] Swap the leading icon for the selection checkbox on item hover, checkbox focus, or checked state.
- [x] Allow `ActionList.Item` to receive composed behavior through Base UI's `render` contract.
- [x] Preserve the semantic `<ul>` and `<li>` structure when context-menu behavior is composed onto an item.
- [x] Keep composed context-menu metadata and focus styles from replacing the item's semantic slot and visual treatment.

## Open product work

[29/07/26]

- None identified for the current interaction.

## Work outside the foundation scope

[29/07/26]

- Application-owned selection rules and context-menu commands.
- Table-specific navigation, pinning, opening, and deletion behavior.

## Settled interaction decisions

[29/07/26]

- [x] Right-click behavior may cover the complete item without combining its left-click controls.
- [x] `ActionList` provides composition support without depending on `ContextMenu`.
- [x] Context-menu activation does not toggle the selection checkbox.

## Open design decisions

[29/07/26]

- None identified for the current interaction.

## Validation checklist

[29/07/26]

- [x] Add regression coverage for right-clicking an action-list selection control.
- [x] Run design-system tests, typecheck, build, and focused lint.
- [x] Run application tests, typecheck, lint, and build.
- [x] Validate the documented example and generated prop metadata.
- [x] Verify checkbox and label context-menu activation in a browser.
