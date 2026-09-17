# Website brand surface

The public website composes semantic brand presentation from a focused design-system entry while retaining ownership of routes, content, metadata, and section ordering.

## Table of contents

This document covers ownership, component contracts, responsive geometry, typography, theming, and production path boundaries.

- [Ownership](#ownership)
- [Brand entry](#brand-entry)
- [Responsive frame](#responsive-frame)
- [Typography](#typography)
- [Color schemes](#color-schemes)
- [Production paths](#production-paths)

## Ownership

`apps/website` owns public routes, copy, metadata, and page assembly. `packages/design-system/src/brand` owns reusable brand presentation and has no route or content knowledge.

The website is a client-rendered TanStack Router SPA. It consumes only public design-system paths and loads Instrument Sans as an application asset.

## Brand entry

`@inspektor/ds/brand` is a focused package entry that remains separate from the generic root barrel.

The entry exports `BrandSiteFrame`, `BrandHero`, and `BrandWordmark`. Public props exclude consumer styling and content escape hatches.

Public components represent reusable visual or semantic units rather than each internal DOM wrapper. Components keep layout-only wrappers private until consumers need to compose or address them independently.

`BrandSiteFrame` accepts header content and ordered main content. It owns the header, continuous main surface, decorative bottom strip, and passive side columns. `BrandHero` accepts route-owned strings and an optional action region. It owns one `h1`, its visual continuation, the supporting paragraph, and the private action layout. Future content regions establish specialized section components when their semantics and layout are known rather than sharing a speculative section wrapper.

## Responsive frame

The brand frame owns the centered page track, passive outer columns, and structural spacing. Decorative columns are private, hidden below the desktop breakpoint, and excluded from the accessibility tree.

The frame uses 4px outer padding and gaps. Below 1280px the center fills the available width. From 1280px the center remains at most 1216px and equal side columns consume the remaining width.

The header is 52px tall. Its private content frame positions a 140×20 wordmark with 16px inline padding, leaving the header surface unpadded. The decorative bottom strip is 46px tall and remains wrapperless while it has no content. The continuous main surface fills the remaining viewport, while hero content stays aligned to its top edge.

The hero's private content frame owns 42px block padding and 16px inline padding at every supported width, leaving the semantic section available for full-width presentation. The content stack keeps 18px between the heading and description. The description has a 710px maximum measure. The optional action region adds 12px to that stack before its 40px primary brand link.

## Typography

The hero heading uses Instrument Sans at weight 450 with 900px and 1471px display breakpoints. The primary title and muted continuation are spans within one `h1`; visual hierarchy does not create a second heading level.

The website preloads the Latin variable WOFF2 used by its initial heading to prevent fallback-font layout movement.

The website vendors the font files, processes their CSS references through Vite, and publishes the OFL text at `/licenses/instrumentSans.txt`. [Instrument Sans website delivery](../research/instrumentSans/instrumentSans.md) records provenance, loading rationale, license obligations, and the maintenance checklist.

Below 900px, the primary title uses 40px text with a 48px line height and the continuation uses 36px text with a 40px line height. The continuation has a 500px maximum below 900px to preserve the selected tablet line break, and the website keeps `application data` together. Both use 48px text and line height from 900px, then 56px text and line height from 1471px. Headings use `-0.96px` tracking through 48px and `-1.1px` tracking at 56px, with pretty wrapping. Descriptions use muted system text at 18px with a 28px line height, zero tracking, and pretty wrapping.

## Color schemes

Private brand semantics assign existing palette values to the canvas and section roles in both system color schemes.

The continuous surface uses gray50 in light mode and neutral950 in dark mode. The canvas uses gray200 and neutral800. The 4px canvas gaps define surface boundaries without component-owned borders.

`BrandSiteFrame` scopes browser text selection to the brand surface. Selection uses gray300 behind gray900 text in light mode and neutral700 behind neutral50 text in dark mode. Component-owned selection treatments can override this inherited pair.

## Production paths

The intended production origin keeps the website at the root and the product under `/conn` so existing origin-scoped connection profiles remain available.

The current product deployment still owns the hostname and redirects `/` to `/conn`. Request routing, product asset namespacing, shared-origin security policy, and deployment transition remain a separate integration decision.
