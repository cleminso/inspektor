# Toaster

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[09/08/26]

- [x] Coordinate connection opening before entry-surface error handling so overlapping consumers cannot duplicate failure notifications.
- [x] Distinguish route-navigation failures from schema-fetch failures in saved-connection notifications.

[07/08/26]

- [x] Prevent overlapping saved-connection requests from producing competing failure notifications.

[07/08/26]

- [x] Report saved-connection opening failures through a normalized error toast because the originating switcher popup is transient.
- [x] Keep add-connection form failures persistent and inline instead of duplicating them as toast notifications.

[06/08/26]

- [x] Retarget repeated-notification feedback from the toast's rendered scale with the Web Animations API.
- [x] Use a restrained two-percent pulse with responsive easing for the professional dashboard context.
- [x] Skip transform-based pulse feedback when reduced motion is requested or Web Animations are unavailable.

[05/08/26]

- [x] Let content determine toast height instead of reserving unused minimum-height space.
- [x] Center titles against the fixed-height trailing controls.
- [x] Compose Close behavior with the design-system ghost icon button.

[05/08/26]

- [x] Omit the description row when no supporting content is provided.

[05/08/26]

- [x] Place the title and trailing Undo and Close controls in one header row.
- [x] Place supporting descriptions below the header so they use the full content width.
- [x] Use the neutral popover background and neutral border for every toast status.
- [x] Express success, warning, and error status through semantic title text colors.
- [x] Add shared `text-success` and `text-warning` semantic color tokens.

[01/08/26]

- [x] Deduplicate matching notifications by using their content as the default semantic ID.
- [x] Preserve explicit IDs so callers can keep matching notification content separate.
- [x] Replay a reduced-motion-safe pulse when Base UI upserts a visible notification.
- [x] Use a neutral toast surface and text treatment for every status.
- [x] Express success, warning, and error status through semantic borders without colored backgrounds.

## Open product work

[01/08/26]

- None.

## Work outside the foundation scope

[01/08/26]

- Promise notification identity remains managed by Base UI.

## Settled interaction decisions

[09/08/26]

- A connection-opening failure does not reopen a switcher that the user explicitly dismissed.

[07/08/26]

- Transient connection-switcher failures use a toast title and supporting recovery guidance without exposing raw browser errors.

[06/08/26]

- Repeated notifications pulse the existing mounted toast without replaying its entrance transition.
- Rapid updates retarget the active pulse instead of stacking or restarting independent keyframe animations.

[05/08/26]

- Toast status changes only the title text color; the surface, border, description, and controls remain neutral.
- Undo and Close form a fixed trailing control group aligned with the title row.

[01/08/26]

- Matching notification content updates the mounted notification and refreshes its dismissal timer.
- The initial notification does not pulse; only repeated notifications pulse.
- Status does not change the toast text or surface color.

## Open design decisions

[27/07/26]

- None.

## Validation checklist

[09/08/26]

- [x] Verify shared connection coordination admits one failure notification source per opening request.
- [x] Verify navigation failures use opening guidance rather than credential guidance.

[07/08/26]

- [x] Verify repeated saved-connection activation starts one request and cannot duplicate its error toast.

[07/08/26]

- [x] Cover normalized saved-connection failure notifications from the switcher and recent-connections list.

[06/08/26]

- [x] Run the focused toaster tests.
- [x] Run focused lint for the toaster files.
- [x] Verify repeated pulses retarget from the rendered scale on the same toast element.
- [ ] Run the design-system typecheck and declaration build after the unrelated `border-input-subtle` token mismatch is resolved.

[05/08/26]

- [x] Run the focused toaster tests.
- [x] Run the design-system typecheck.
- [x] Run focused lint for the toaster and semantic-token files.
- [x] Build the design-system package.
- [x] Verify the header layout and description placement in the design-system application.
- [x] Verify neutral status surfaces and semantic title colors in light and dark themes.

[01/08/26]

- [x] Run the focused toaster tests.
- [x] Run the design-system typecheck.
- [x] Run focused lint for the toaster files.
- [x] Build the design-system package.
- [x] Verify neutral status surfaces in the focused toaster tests.
