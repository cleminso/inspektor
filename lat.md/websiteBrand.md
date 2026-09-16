# Website brand surface

The public website composes reusable brand presentation from a focused design-system entry while retaining ownership of routes, content, and metadata.

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

The entry exports `BrandPageFrame`, its semantic page regions, `BrandHero`, `BrandWordmark`, `BrandSection`, and closed `BrandText` roles. Public props exclude consumer styling escape hatches.

## Responsive frame

The brand frame owns the centered page track, passive outer columns, and structural spacing without exposing decorative columns in the document tree.

The frame uses 4px outer padding and gaps. Below 1280px the center fills the available width. From 1280px the center remains at most 1216px and equal side columns consume the remaining width.

Header and footer surfaces are 46px tall. The header contains a 140×20 wordmark. The main region fills the remaining viewport, while hero content stays aligned to its top edge.

The hero follows the reference nesting rather than placing padding on the section. `BrandHero` is an unpadded section, `BrandHero.Content` owns the content width, `BrandHero.Frame` owns responsive block padding, and `BrandHero.Message` owns inline padding and message spacing.

## Typography

Brand typography uses Instrument Sans at weight 450 with fixed semantic elements and 900px and 1471px display breakpoints.

Headings use fixed 48px and 56px line heights, `-0.02em` tracking, and pretty wrapping. Descriptions use muted 18px text, 28px line height, zero tracking, pretty wrapping, and a 600px maximum measure.

## Color schemes

Private brand semantics assign existing palette values to the canvas and section roles in both system color schemes.

Sections use gray50 in light mode and neutral950 in dark mode. The canvas uses gray200 and neutral800. Boundaries link to the generic default border semantic.

## Production paths

The intended production origin keeps the website at the root and the product under `/conn` so existing origin-scoped connection profiles remain available.

The current product deployment still owns the hostname and redirects `/` to `/conn`. Request routing, product asset namespacing, shared-origin security policy, and deployment transition remain a separate integration decision.
