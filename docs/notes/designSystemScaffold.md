# Design System Scaffold Rationale

## Table of Contents

- [Goal](#goal)
- [Package and App Split](#package-and-app-split)
- [Why StyleX](#why-stylex)
- [Why `@stylexjs/unplugin`](#why-stylexjsunplugin)
- [Why Oxlint and Oxfmt](#why-oxlint-and-oxfmt)
- [Why `tsup` for the Package](#why-tsup-for-the-package)
- [Polar-Inspired Workflow](#polar-inspired-workflow)
- [Why Generated Props Are Only Scaffolded](#why-generated-props-are-only-scaffolded)
- [Validation Intent](#validation-intent)

## Goal

The design system has two jobs:

1. `packages/design-system` defines reusable Inspector primitives and tokens.
2. `apps/design-system` shows those primitives in a small documentation app.

The setup is inspired by Polar Orbit, but adapted to this workspace instead of copying its Next.js app structure.

## Package and App Split

The package stays focused on reusable code. It should not know which app consumes it or how docs are rendered.

The app stays focused on presentation, examples, and navigation. It consumes `@inspector/ds` the same way `apps/web` will consume it, so documentation catches packaging and integration issues early.

This separation keeps the design system useful outside the docs app and prevents docs-only concerns from leaking into the package API.

## Why StyleX

StyleX gives the package a typed, colocated styling model while still producing extracted CSS in consuming apps.

It fits the design system package because tokens and primitives can live with the components that use them. It also avoids growing a Tailwind-specific API for package internals, which keeps the package less coupled to app-level CSS conventions.

## Why `@stylexjs/unplugin`

The consuming app needs to compile StyleX imports from `@inspector/ds` into CSS. Vite does not do that by itself.

`@stylexjs/unplugin` is the correct integration point for Vite because it runs during the bundling pipeline and handles StyleX transformation plus CSS extraction. That means `apps/design-system` and `apps/web` can consume package source files and still get the generated CSS output.

We avoided `postcss.config.ts` for this app because PostCSS is not the primary integration point for a Vite-first StyleX setup. The Vite plugin keeps the transformation closer to the module graph, which matters when importing StyleX files from workspace packages.

## Why Oxlint and Oxfmt

Oxlint and Oxfmt match the project direction and keep the design system setup light.

For StyleX-specific rules, Oxlint can load `@stylexjs/eslint-plugin` through JS plugins. That gives us StyleX authoring checks without adding a separate ESLint command just for the package.

If Oxlint plugin compatibility becomes a blocker for a StyleX rule, the fallback should be a narrow lint command for StyleX checks only, not a full parallel linting stack.

## Why `tsup` for the Package

`tsup` keeps the package build simple: source entry in, ESM/CJS/types out.

The package should build distributable JavaScript and declarations, but it should not own final StyleX CSS extraction. CSS extraction belongs to the consuming app because the app owns the final bundle and can combine styles across app code and workspace packages.

## Polar-Inspired Workflow

The useful pattern from Polar Orbit is the communication model, not the framework-specific setup.

`apps/design-system` should import real package exports from `@inspector/ds`. This keeps examples in sync: if a component renders in docs, the package export works.

The docs registry carries the manual metadata needed to document a package item:

- page title and slug
- route path
- package import path
- source file path
- readiness status
- optional prop metadata slug

Adding a component remains deliberate:

1. implement the component in `packages/design-system`
2. export it from `@inspector/ds`
3. add a registry item in `apps/design-system`
4. add or update the page module outside `src/routes`
5. add prop metadata only when the API is stable enough to document

## Generated Props

Polar uses generated AST metadata to support curated prop tables.

We scaffolded the same extension point with:

- `apps/design-system/scripts/extract-props.mjs`
- `apps/design-system/src/generated/props.json`
- `apps/design-system/src/lib/propsData.ts`

The script currently writes an empty metadata object. This keeps the workflow visible without adding AST extraction complexity too early. When components stabilize, the script can start reading `packages/design-system/src` and filling generated type/source metadata.

## Validation Intent

The focused checks each cover a different risk:

- package lint: validates TypeScript and StyleX authoring rules
- package typecheck: validates exported source types
- package build: validates package output and declaration generation
- app lint: validates app route and shell source
- app typecheck: validates route bindings and workspace imports
- app build: validates Vite, TanStack Router generation, and StyleX extraction together
- app prop generation: validates the docs metadata pipeline once extraction becomes real

Generated files such as `src/routeTree.gen.ts` should not be edited by hand.
