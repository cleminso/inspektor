# Find Bar

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[12/08/26]

- [x] Keep settled match arrows visually stable while deferred replacement results temporarily block navigation.
- [x] Preserve settled result text while replacement search work is pending and disable stale navigation.
- [x] Support action-opened Find Bars that autofocus their query and dismiss from Escape.

[06/08/26]

- [x] Replace native browser titles on search-option and match-navigation actions with shared Tooltip composition.

[04/08/26]

- [x] Add a controlled find query field with match position and previous and next actions.
- [x] Compose the control from `InputGroup` without exposing size, width, variant, or styling props.
- [x] Support Enter for the next match and Shift+Enter for the previous match.
- [x] Integrate ordered literal match navigation with `JsonView` without moving focus from the query field.
- [x] Replace the row JSON Search usage and remove the exported Search component.
- [x] Add package tests, application integration tests, and design-system documentation.
- [x] Add controlled match-case, whole-word, and regular-expression options.
- [x] Separate the query field, match status, and arrow navigation within one bordered find surface.
- [x] Use arrow-up and arrow-down navigation icons without a dismiss action.
- [x] Apply Find Bar options to JsonView occurrence matching and highlighting.
- [x] Keep searchbox semantics without exposing the browser-native search cancel control.
- [x] Reserve a fixed semantic width for result status so query width does not shift between result states.
- [x] Keep disabled ghost navigation actions transparent.

## Open product work

[04/08/26]

- None.

## Work outside the foundation scope

[04/08/26]

- Find and replace belongs to the editable CodeEditor search panel.
- Editing the normalized row JSON representation is not part of Find Bar.
- Find and replace mode, replacement input, and replacement actions are not part of the read-only Find Bar contract.

## Settled interaction decisions

[12/08/26]

- Pending replacement searches expose settled match arrows as unavailable without switching to disabled styling.
- Pending replacement searches keep the preceding settled status visible without allowing navigation through stale results.
- A transient Find Bar may move focus to its query when opened by an explicit user action and dismiss from Escape.

[04/08/26]

- Find Bar searches a read-only document and navigates ordered matches.
- The control fills its container and uses the small control scale without public layout props.
- The match position counts textual occurrences rather than matching JSON rows.
- Navigation wraps at the first and last match while focus remains in the query field.
- The persistent row JSON control has no dismiss action.
- Query options are controlled by the consumer so the searched document and Find Bar use one search configuration.
- Invalid regular expressions produce an empty result set without interrupting document inspection.
- Result status changes do not resize the query field.

## Open design decisions

[04/08/26]

- None.

## Validation checklist

[06/08/26]

- [x] Cover authored Find Bar tooltips and absence of native `title` attributes.

[04/08/26]

- [x] Focused Find Bar, JsonView, and row-editor integration tests pass.
- [x] Inspector application typecheck, lint, and build pass.
- [x] Design-system props generation and checks pass.
- [x] Design-system documentation tests, typecheck, lint, and build pass.
- [x] Design-system package tests, typecheck, focused lint, and build pass.
- [ ] The complete Inspector application test suite has an unrelated dock icon-size failure: expected `xs`, received `s`.
- [x] Find Bar option and row JSON integration tests pass.
- [x] Find Bar documentation metadata, typecheck, lint, and build pass.
- [x] Find Bar layout, pressed options, match status, arrow navigation, and absent dismiss action are verified in the design-system documentation.
- [x] Find Bar query width, absent native cancel control, and transparent disabled navigation are verified in the browser.
