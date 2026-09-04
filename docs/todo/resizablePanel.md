# Resizable Panel

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[01/08/26]

- [x] Keep collapsed resize handles mounted so pointer and keyboard interaction can reopen their panels.
- [x] Open collapsible panels at 200px when the consumer does not provide `defaultSize`.
- [x] Leave non-collapsible panels under group-owned automatic sizing.

## Work outside the foundation scope

[01/08/26]

- [x] Keep layout persistence outside this behavior change.

## Settled interaction decisions

[01/08/26]

- [x] Keep `defaultSize` as the only panel opening-size API.
- [x] Forward panel refs and resize callbacks directly to `react-resizable-panels`.

## Validation checklist

[01/08/26]

- [x] Run focused Resizable Panel behavior tests.
- [x] Run design-system tests, generated-prop checks, typecheck, lint, and build.
- [x] Run Inspektor tests, typecheck, lint, and build.
