# Website brand plan

## Table of contents

- [Summary](#summary)
- [Status](#status)
- [Current behavior](#current-behavior)
- [Accepted scope](#accepted-scope)
- [First implementation iteration](#first-implementation-iteration)
- [Work outside the scope](#work-outside-the-scope)
- [Settled decisions](#settled-decisions)
- [Open decisions](#open-decisions)
- [Dependencies](#dependencies)
- [Implementation tasks](#implementation-tasks)
- [Validation checklist](#validation-checklist)
- [Outcome](#outcome)
- [Retro](#retro)

## Summary

Create a public Inspektor website as a TanStack Router SPA. The website composes generic design-system components with a focused brand surface from `@inspektor/ds/brand`.

## Status

- State: review
- Delivery: commit
- Base commit: none
- Session: none
- Commits: none
- Pull request: none

## Current behavior

- The workspace has no public website application.
- `apps/web` is the inspector product application.
- The deployed product currently owns `inspektor.dev` as one static-assets SPA and redirects `/` to `/conn` in the client router.
- The product build emits root-relative assets and root-owned public files, so it cannot yet share path ownership with a separately built root website.
- `packages/design-system` publishes generic components and tokens through `@inspektor/ds`.
- The package has no public brand entry.
- The applications load Geist Sans and Geist Mono. The design system owns their semantic use but does not load font assets.

## Accepted scope

- Add `apps/website` as a TanStack Router SPA.
- Keep website routes, copy, metadata, SEO, analytics, and page assembly in `apps/website`.
- Add reusable branded presentation under `packages/design-system/src/brand`.
- Publish branded components through `@inspektor/ds/brand` rather than the root barrel.
- Keep brand and studio presentation in separate module contexts.
- Add a brand page frame for the responsive centered website layout.
- Add closed brand typography roles backed by Instrument Sans.
- Support light and dark color schemes.
- Update current-state architecture and Lat documentation to match the implemented package and application surfaces.

## First implementation iteration

- Create `packages/design-system/src/brand` and publish its public components through `@inspektor/ds/brand`.
- Create `apps/website` with TanStack Router and StyleX source consumption.
- Implement the complete responsive page frame with its outer canvas, header region, central content sections, footer region, and passive desktop side columns.
- Render the canonical Inspektor wordmark in the compact header.
- Keep the page heading, muted continuation, and description together in one top-aligned hero message.
- Render this initial content:
  - Page heading: `inspektor studio`
  - Section heading: `inspect your Jazz application data`
  - Description: `Inspektor connects to your sync server. It loads the schema, creates an admin client locally in your browser, and renders an interface for you to inspect your application data.`
- Support the accepted heading sizes and both color schemes.
- Keep the existing product deployment and `/` redirect unchanged in this iteration.

## Work outside the scope

- Rename `apps/web` to `apps/studio`.
- Classify or move existing design-system components into a studio surface.
- Build server rendering or static generation.
- Add route-aware behavior to brand components.
- Add website copy, metadata, or content models to the design-system package.
- Add a call to action or marketing sections beyond the accepted heading and description content.
- Configure a Worker, domain, or deployment pipeline for the website.
- Change the existing product's route ownership, asset paths, root redirect, or browser storage.
- Add third-party analytics before the shared-origin dependency and content-security-policy review.
- Enable Instrument Sans stylistic set `ss02`. Keep it as open brand work pending a rendered comparison.

## Settled decisions

- The application path is `apps/website`.
- The application package name is `inspektor.website`.
- The website uses TanStack Router as a client-rendered SPA.
- The intended production ownership is `apps/website` at `inspektor.dev/` and non-product paths, with `apps/web` retaining `/conn` and its descendants on the same origin.
- Same-origin ownership preserves the product's existing origin-scoped connection profiles. Website code and dependencies must therefore be treated as product-trusted code.
- `packages/design-system` remains the package owner for generic and branded presentation.
- `@inspektor/ds/brand` is a focused public entry. Brand exports do not enter the generic root barrel.
- Brand components may consume public generic design-system APIs. Generic modules do not consume brand modules.
- The first brand entry exports `BrandPageFrame`, its `Header`, `Main`, and `Footer` parts, `BrandHero`, `BrandWordmark`, `BrandSection`, and `BrandText` with their public prop types. `BrandHero.Content` and `BrandHero.Frame` expose the same nested layout boundaries as the reference structure.
- `BrandPageFrame` renders the passive side columns internally. Its public parts express semantic page regions rather than expose the empty columns to consumers.
- Public brand component props omit `className`, `style`, and arbitrary typography overrides.
- Instrument Sans is the brand sans-serif. The website application loads the font assets; brand typography owns their semantic presentation.
- Brand text uses weight `450` through the standard `font-weight` property.
- The description uses a 600px maximum. Headings use the available hero width.
- Headings use Instrument Sans default glyphs.
- Brand text has these responsive roles:

  | Role             | Default element | Below 900px | From 900px | From 1471px | Line height     | Tracking  | Wrapping |
  | ---------------- | --------------- | ----------: | ---------: | ----------: | --------------- | --------- | -------- |
  | `pageHeading`    | `h1`            |        40px |       48px |        56px | `48px` / `56px` | `-0.02em` | `pretty` |
  | `sectionHeading` | `h2`            |        36px |       36px |        56px | `48px` / `56px` | `-0.02em` | `pretty` |
  | `description`    | `p`             |        18px |       18px |        18px | `28px`          | `0`       | `pretty` |

- The section heading and description use an opaque muted text treatment that preserves normal-text contrast.
- `BrandText.Line` preserves intentional display-heading line breaks.
- The header and footer surfaces are 46px tall. The header positions a 140×20 wordmark with 12px inline padding.
- The hero section itself is unpadded. Its content container owns width, its inner frame owns 42px block padding and 84px from the 1471px desktop breakpoint, and its message frame owns 12px inline padding.
- The hero message uses an 18px gap between its zero-gap heading group and description.

- The page frame has 4px outer padding and 4px gaps between visible columns.
- Below 1280px, the central column fills the available inline space and the passive side columns are absent.
- From 1280px, the central column has a 1216px maximum width. At 1280px, each passive side column is 24px wide.
- Above 1280px, both passive side columns grow equally while the central column remains 1216px wide. At 2048px, each side column is 408px wide.
- Content sections inside the central column use 12px inline padding.
- Private brand semantic colors map the existing palette to layout responsibilities. Brand component styles consume these roles rather than palette values directly:

  | Role                          | Light             | Dark                 |
  | ----------------------------- | ----------------- | -------------------- |
  | Central section surface       | `palette.gray50`  | `palette.neutral950` |
  | Outer canvas and side columns | `palette.gray200` | `palette.neutral800` |
  | Section boundaries            | `palette.gray300` | `palette.neutral700` |

- The section-boundary role links to the existing `borderColors.default` semantic token. Private brand variables own the central-surface and outer-canvas mappings.
- The brand color model supports both light and dark schemes.

## Open decisions

- None for the accepted implementation scope.
- Production publication requires a separate integration decision for Cloudflare request routing, product asset namespacing, shared-origin headers and content security policy, validation, and rollback.

## Dependencies

- Waiting on: none
- Owner: none
- Evidence: none
- Unblock condition: none
- Production publication: blocked on an accepted same-origin integration plan; this does not block the website UI implementation.

## Implementation tasks

- [x] Run the applicable TanStack intent skill check from the workspace root.
- [x] Define the public brand contracts and contract tests.
- [x] Add the `@inspektor/ds/brand` source and distribution entry.
- [x] Add Instrument Sans as an application-loaded variable WOFF2 dependency.
- [x] Implement the brand page frame, section spacing, and typography roles with StyleX.
- [x] Document the reusable wordmark in the design-system application.
- [x] Create the `inspektor.website` SPA and configure TanStack Router, StyleX source consumption, light and dark schemes, and route metadata.
- [x] Compose the website route from public `@inspektor/ds` and `@inspektor/ds/brand` imports with the accepted heading and description content.
- [x] Extend lint scopes and public import-boundary validation to cover the website and brand source.
- [x] Update `ARCHITECTURE.md` and applicable Lat current-state sections.

## Validation checklist

- [x] `pnpm --filter @inspektor/ds test`
- [x] `pnpm --filter @inspektor/ds lint`
- [x] `pnpm --filter @inspektor/ds typecheck`
- [x] `pnpm --filter @inspektor/ds build`
- [ ] `pnpm --dir apps/design-system test`
- [ ] `pnpm --dir apps/design-system lint`
- [x] `pnpm --dir apps/design-system typecheck`
- [x] `pnpm --dir apps/design-system build`
- [x] `pnpm --dir apps/website test`
- [x] `pnpm --dir apps/website lint`
- [x] `pnpm --dir apps/website typecheck`
- [x] `pnpm --dir apps/website build`
- [x] `pnpm --filter @inspektor/ds exec vitest run src/brand`
- [x] Add `apps/website/e2e/website.spec.ts` with the viewport values selected by the page-frame decision.
- [x] `pnpm --dir apps/website exec playwright test e2e/website.spec.ts`
- [x] Verify the selected responsive frames visually in the production browser build.
- [x] Keep a small browser smoke test for accepted content, viewport fit, light and dark schemes, and console errors.
- [x] `git diff --check`
- [x] `lat check`

## Outcome

Implemented and independently reviewed. The design-system package, website package, browser suite, and affected builds pass. The design-system documentation lint baseline still has three invalid `autoComplete` values in existing input demos. Its full test baseline still has four unrelated page-test failures in the accordion, copy-button, date-picker, and input documentation.

## Retro

Not completed.
