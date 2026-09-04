# Alert Dialog implementation checklist

## Table of contents

- [Source audit](#source-audit)
- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Source audit

[17/08/26]

- [x] Confirm `@base-ui/react` 1.6.0 is installed and import Alert Dialog from `@base-ui/react/alert-dialog`.
- [x] Review the Base UI Alert Dialog API, composition handbook, and tagged 1.6.0 source.
- [x] Preserve Root controlled state, change details, focus management, Escape dismissal, focus trapping, restoration, and `alertdialog` semantics.
- [x] Keep Portal, Backdrop, Viewport, and Popup structural parts internal to Content.
- [x] Preserve Popup `initialFocus`, `finalFocus`, refs, DOM props, and generated state attributes through Content.
- [x] Preserve Title and Description generated labeling relationships and their heading and paragraph defaults.
- [x] Preserve Close refs, handlers, disabled state, generated attributes, and exact Base UI `render` composition.
- [x] Omit consumer `className`, `style`, and structural-part `render` props; fix Close to native-button semantics because supported render targets are design-system Buttons.
- [x] Record Backdrop, Viewport, Popup, and Close callback states in named StyleX rules; no Base UI CSS variables are required by this presentation.

## Implemented foundation

[17/08/26]

- [x] Add the constrained `AlertDialog.Root`, `Content`, `Title`, `Description`, `Actions`, and `Close` compound API.
- [x] Build modal presentation from existing StyleX surface, layer, width, typography, border, shadow, and spacing tokens.
- [x] Compose Close onto Button by default while allowing consumers to select a Button variant through `render`.
- [x] Export every public part prop type from `@inspektor/ds`.
- [x] Add package behavior tests and design-system documentation.

## Open product work

[17/08/26]

- None.

## Work outside the foundation scope

[17/08/26]

- Alert dialog triggers and detached handles are not exposed; product features control Root state.
- Nested alert dialog presentation is not demonstrated.

## Settled interaction decisions

[17/08/26]

- [x] Require an explicit user response while preserving Base UI Escape dismissal.
- [x] Place initial focus using Base UI Popup behavior and restore focus after close.
- [x] Keep actions trailing-aligned and allow wrapping in constrained viewports.
- [x] Let Button own Close presentation while AlertDialog owns close behavior.

## Open design decisions

[17/08/26]

- None.

## Validation checklist

[17/08/26]

- [x] Focused and package-wide AlertDialog behavior tests pass.
- [x] Changed StyleX and package files pass lint.
- [x] Design-system package typecheck and build pass.
- [x] Documentation tests, generated props check, typecheck, lint, and build pass.
- [x] Browser validation confirms focus placement, focus trapping, Escape dismissal, and focus restoration.
