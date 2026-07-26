# Segmented Control implementation checklist

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[26/07/26]

- [x] Build the single-selection control from Base UI Tabs.
- [x] Link each segment to a corresponding accessible panel.
- [x] Move one shared selection indicator between segments.
- [x] Disable indicator motion under reduced-motion preferences.
- [x] Keep represented panel changes immediate.
- [x] Support content and full-width lists.
- [x] Use the control for the row editor's Details and JSON representations.
- [x] Document that motion communicates alternate views of one persistent object.

## Work outside the foundation scope

[26/07/26]

- [x] Keep primary navigation and independent pressed states on their existing controls.
- [x] Do not animate panel content.
- [x] Do not expose timing, easing, indicator, or styling overrides.

## Settled interaction decisions

[26/07/26]

- [x] Arrow-key focus activates the focused segment.
- [x] Selection always represents one associated panel.
- [x] Indicator motion explains continuity rather than delaying feedback.

## Validation checklist

[26/07/26]

- [x] Focused Segmented Control tests pass.
- [x] Row editor Details and JSON tests pass.
- [x] Design-system package tests, typecheck, build, and changed-file lint pass.
- [x] Inspector application typecheck, lint, and build pass.
- [x] Documentation tests, generated prop checks, typecheck, lint, and build pass.
