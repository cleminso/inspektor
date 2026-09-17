# Design-system scaffold rationale

This document explains why the design system uses separate package and documentation applications, StyleX, Oxlint, Oxfmt, and TSDown.

## Table of contents

The sections cover package ownership, build and styling tools, documentation workflow, authored scenarios, and validation.

- [Goal](#goal)
- [Package and app split](#package-and-app-split)
- [Why StyleX](#why-stylex)
- [Why `@stylexjs/unplugin`](#why-stylexjsunplugin)
- [Why Oxlint and Oxfmt](#why-oxlint-and-oxfmt)
- [Why TSDown for the package](#why-tsdown-for-the-package)
- [Documentation workflow](#documentation-workflow)
- [Authored scenarios](#authored-scenarios)
- [Validation intent](#validation-intent)

## Goal

The design-system surfaces have three jobs:

1. `packages/design-system` defines reusable Inspektor primitives and tokens.
2. `apps/design-system` shows those primitives in a small documentation app.
3. `apps/website` consumes focused brand components in the public website.

The setup is inspired by Polar Orbit, but adapted to this workspace instead of copying its Next.js app structure.

## Package and app split

The package stays focused on reusable code. It should not know which app consumes it or how docs are rendered.

The documentation app stays focused on examples and navigation. It consumes `@inspektor/ds` through the same public source contract as `apps/web` and `apps/website`, so documentation catches packaging and integration issues early.

This separation keeps the design system useful outside the docs app and prevents docs-only concerns from leaking into the package API. [[lat.md/mental-model-ds-package#Design-system package mental model]] describes the resulting package artifacts.

## Why StyleX

StyleX gives the package a typed, colocated styling model while still producing extracted CSS in consuming apps.

It fits the design system package because tokens and primitives can live with the components that use them. It also avoids growing a Tailwind-specific API for package internals, which keeps the package less coupled to app-level CSS conventions.

## Why `@stylexjs/unplugin`

The consuming app needs to compile StyleX imports from `@inspektor/ds` into CSS. Vite does not do that by itself.

`@stylexjs/unplugin` is the correct integration point for Vite because it runs during the bundling pipeline and handles StyleX transformation plus CSS extraction. That means all workspace Vite applications can consume package source files and still get the generated CSS output.

We avoided `postcss.config.ts` for this app because PostCSS is not the primary integration point for a Vite-first StyleX setup. The Vite plugin keeps the transformation closer to the module graph, which matters when importing StyleX files from workspace packages.

## Why Oxlint and Oxfmt

Oxlint and Oxfmt match the project direction and keep the design system setup light.

For StyleX-specific rules, Oxlint can load `@stylexjs/eslint-plugin` through JS plugins. That gives us StyleX authoring checks without adding a separate ESLint command just for the package.

If Oxlint plugin compatibility becomes a blocker for a StyleX rule, the fallback should be a narrow lint command for StyleX checks only, not a full parallel linting stack.

## Why TSDown for the package

TSDown provides ESM-first React library compilation through Rolldown and Oxc. Unbundle mode preserves each StyleX source module instead of collapsing StyleX variable definitions and component styles into a package-level bundle.

The package build runs TSDown for JavaScript followed by one declaration-emitting TypeScript pass. TSDown's declaration generator is not used because declaration emission alone does not reject semantic type errors; `tsc -p tsconfig.build.json` checks and emits declarations in one operation.

The package should build distributable JavaScript and declarations, but it should not own final StyleX CSS extraction. CSS extraction belongs to the consuming app because the app owns the final bundle and can combine styles across app code and workspace packages.

## Documentation workflow

`apps/design-system` uses React, Vite, TanStack Router, and MDX with separate authoring and execution responsibilities.

MDX owns prose and scenario order while strict TSX modules own executable examples, state, and StyleX. Static `.tsx` route modules import MDX pages from `src/content`; MDX files do not participate directly in TanStack route generation.

Executable examples import real package exports from `@inspektor/ds`. Each example is imported normally for rendering and through Vite `?raw` for displayed source, so the preview and copyable code share one source file.

The docs registry carries the manual metadata needed to document a package item:

- page title and slug
- route path
- source file path

Adding a component remains deliberate:

1. implement the component in `packages/design-system`
2. export it from `@inspektor/ds`
3. add a registry item in `apps/design-system`
4. author `src/content/components/{componentName}/page.mdx`
5. add one or more meaningful TSX scenarios under the page's `demos` directory
6. add a static route under `src/routes/components`

## Authored scenarios

Each component page is an authored narrative rather than a generic prop inspector. Pages select scenarios that explain accepted Inspektor usage, not every technically possible prop combination.

The shared page renders registry-owned title, description, and package source metadata. MDX supplies headings, prose, examples, anatomy, and best practices through a constrained component map.

Each scenario lives in one typechecked `.tsx` file. `ComponentDemo` renders that module inside a content-height preview and places a source disclosure directly below it in the same bordered surface. The collapsed disclosure reveals the exact raw source with copy support, keyboard scrolling, and wide-viewport line numbers. Stateful scenarios own their interaction state and receive focused tests.

The documentation shell composes `ShellLayout.LeftDock` with `ShellLayout.View` on wider viewports. Dock navigation uses `SidePanel`, with `Tree.Root` as its direct child and sole scroll owner so the visible rail stays flush with the panel edge. The view owns no page padding. `ComponentPage` applies `4xl` horizontal and `2xl` vertical padding to its header and content surfaces, while `ComponentDemo` applies `2xl` padding to each executable preview. Narrow viewports retain a dedicated full-width navigation toggle.

MDX remains an authoring layer. Stateful behavior, StyleX definitions, and substantial data stay in TSX. Pages may include several named scenarios when each teaches a distinct usage pattern. Generated prop tables and inspector controls are outside this model.

The registry preserves the complete component documentation catalog. A catalog contract test requires every registered component to have a stable route, an authored MDX page, and at least one executable TSX scenario.

## Validation intent

The focused checks each cover a different risk:

- package lint: validates TypeScript and StyleX authoring rules
- package typecheck: validates exported source types
- package build: validates package output and declaration generation
- app lint: validates app route and shell source
- app typecheck: validates route bindings and workspace imports
- app scenario tests: validate rendered guidance and interactive behavior
- app build: validates MDX, Vite, TanStack Router generation, and StyleX extraction together

Generated files such as `src/routeTree.gen.ts` should not be edited by hand.
