# Frontend Architecture

## Table of contents

- [Purpose](#purpose)
- [Workspace map](#workspace-map)
- [Ownership boundaries](#ownership-boundaries)
- [Browser-to-feature execution flow](#browser-to-feature-execution-flow)
- [Design-system package contract](#design-system-package-contract)
- [How workspace applications resolve the design system](#how-workspace-applications-resolve-the-design-system)
- [Vite configuration](#vite-configuration)
- [Static and deferred dependency graphs](#static-and-deferred-dependency-graphs)
- [Runtime boundaries in the Inspector](#runtime-boundaries-in-the-inspector)
- [Dependency roles](#dependency-roles)
- [Adding a dependency or export](#adding-a-dependency-or-export)
- [Validation](#validation)
- [Glossary](#glossary)

## Purpose

This document explains how the Inspector frontend is assembled and why its boundaries exist. It is a guide for deciding where new code and dependencies belong, rather than a complete API reference.

The key model is:

> `apps/web` owns Inspector product behavior and data. `@inspector/ds` owns reusable UI behavior and presentation. `apps/design-system` documents and validates the public design-system contract.

The import-boundary rules for optional heavy behavior are specified in [docs/importBoundaryPlaybook.md](docs/importBoundaryPlaybook.md). Component-level decisions belong in the corresponding `docs/todo/*.md` checklist.

## Workspace map

The repository is a PNPM workspace. The root workspace configuration includes applications under `apps/*` and packages under `packages/*`. The catalog in `pnpm-workspace.yaml` centralizes versions that multiple workspace projects use.

| Location                  | Role                                            | May depend on                                                             |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web`                | Inspector product application                   | `@inspector/ds`, product and data dependencies                            |
| `apps/design-system`      | Component documentation and executable examples | public `@inspector/ds` exports and documentation dependencies             |
| `packages/design-system`  | The `@inspector/ds` reusable UI package         | UI primitives and reusable interaction dependencies                       |
| `packages/jazz-dev-tools` | Separate Jazz tooling package                   | Outside this frontend replacement architecture unless explicitly in scope |

`apps/web` and `apps/design-system` are consumers of `@inspector/ds`. They must use its published public paths, not reach into `packages/design-system/src` with relative imports. This keeps the package boundary real even though all projects are in one repository.

## Ownership boundaries

### `apps/web`

The product application owns concerns specific to inspecting a Jazz application:

- TanStack Router routes and route parameters.
- Connection storage, navigation, and session state.
- Jazz client creation, schema access, query subscriptions, and mutations.
- Feature composition, such as the table explorer and onboarding flows.
- Product-specific layout and orchestration.

### `packages/design-system`

The design system owns reusable presentation and interaction behavior:

- Design tokens and StyleX styling rules.
- Components built from Base UI or intrinsic elements where an interactive primitive is unnecessary.
- Accessible keyboard, focus, selection, popup, and form behavior provided by component primitives.
- Public component props and consumer-facing types.
- Reusable optional behavior, including carefully scoped deferred loading boundaries.

### `apps/design-system`

The documentation application is a real consumer of the design system. It owns:

- Component pages, registry metadata, and navigation for pages that exist.
- Executable examples imported from `@inspector/ds`.
- Displayed example source and generated component-prop metadata.
- Documentation-only tooling such as Shiki.

It must not import package-private implementation files at runtime. If documentation cannot express or demonstrate a needed public behavior, the public component API or documentation design needs reconsideration.

## Browser-to-feature execution flow

The normal Inspector path is:

1. The browser loads the HTML entry produced by Vite for `apps/web`.
2. The entry module mounts React and creates the TanStack Router.
3. The root route mounts `InspectorSessionProvider`. It can read local connection and route state without creating a Jazz client.
4. TanStack Router loads route modules according to the current URL. It can preload a route when user intent suggests navigation.
5. The connection route resolves its saved branch and schema-hash preferences, then mounts `InspectorProvider`.
6. `InspectorProvider` creates the Inspector runtime and provides the Jazz client to its descendants.
7. Product feature routes compose `@inspector/ds` components with product data and callbacks.

This separation is intentional. Connection setup and onboarding do not need a Jazz runtime. Table and query-subscription descendants do need one shared runtime, so it is mounted at their common route boundary.

## Design-system package contract

`packages/design-system/package.json` defines the package contract. Consumers should only import paths listed in its `exports` map:

| Import path             | Intended surface                                           |
| ----------------------- | ---------------------------------------------------------- |
| `@inspector/ds`         | Main public component, token, primitive, and hook barrel   |
| `@inspector/ds/theme`   | Theme token entry                                          |
| `@inspector/ds/tooltip` | Focused Tooltip entry used at an application-wide boundary |

### Public barrels

The root `src/index.ts` is a public barrel: a module that explicitly re-exports supported components and consumer-facing types. It gives consumers a stable import path and lets package internals change without updating every application import.

A barrel is not permission to export every implementation file. It is an API decision. Do not statically re-export an implementation that is intentionally deferred, because that would reconnect its dependency graph to every root-barrel consumer.

Focused subpaths are useful when a broad application boundary needs one public capability without traversing an unrelated root surface. They are not automatically a production bundle optimization. Actual output depends on the selected export, static reachability, tree shaking, and the final application dependency graph.

### Source and distribution contracts

The package provides two valid resolution targets for the same public import path:

| Export condition       | Target                      | Consumer                          |
| ---------------------- | --------------------------- | --------------------------------- |
| `inspector-source`     | TypeScript source in `src`  | Workspace Vite applications       |
| `import` and `default` | ESM JavaScript in `dist`    | Consumers using the built package |
| `types`                | Declaration files in `dist` | TypeScript tooling                |

The public API and the resolved file are separate concepts. For example, `@inspector/ds/tooltip` remains a supported public import whether it resolves to `src/components/tooltip/tooltip.tsx` or `dist/components/tooltip/tooltip.js`.

The package emits ESM only. There is no CommonJS build because this workspace has no CommonJS consumer. This reduces package-output maintenance, but does not itself reduce web application cost when Vite resolves the source contract.

### Dependency declarations

`react` and `react-dom` are peer dependencies of `@inspector/ds`. The application supplies them, so the application and the design system use the same React runtime. Bundling a separate React copy inside the design system would risk broken context, hooks, and duplicated runtime work.

Dependencies that the component implementation needs at runtime, such as Base UI and StyleX, belong to the design-system package. Build and test tooling belongs in `devDependencies` when it is not required by a consumer at runtime.

`sideEffects: false` is a package promise to bundlers: importing an unused module has no required import-time behavior. It enables removal of unused code. It must not be declared if a module depends on import-time global setup, CSS registration, polyfills, or singleton initialization.

## How workspace applications resolve the design system

Both Vite applications declare these resolution conditions:

`inspector-source`, `module`, `browser`, `development|production`.

`resolve.conditions` tells Vite that `inspector-source` is an allowed package condition. The package export map declares `inspector-source` before its built `import` and `default` targets, so Vite selects the TypeScript source target for an `@inspector/ds` public import. Vite then processes that source as part of the consuming application build.

This is required by the current StyleX architecture. The StyleX Vite plugin needs to transform the components and collect their styles while Vite builds the consuming application. Resolving only the prebuilt `dist` files would change that pipeline.

Both applications also exclude `@inspector/ds` from Vite dependency optimization. The dependency optimizer is designed for third-party dependencies that Vite can prebundle as opaque inputs. `@inspector/ds` is linked workspace source that must remain available to the Vite and StyleX transforms.

This means a design-system `tsup` build verifies its distribution contract, while `apps/web` and `apps/design-system` builds verify source consumption. Neither check replaces the other.

## Vite configuration

### Shared configuration choices

| Setting                                       | Why it exists                                                   | What to preserve                                            |
| --------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `resolve.conditions`                          | Selects the workspace source contract of `@inspector/ds`        | Keep it aligned with package exports                        |
| `resolve.tsconfigPaths`                       | Lets Vite use TypeScript path aliases                           | Keep aliases consistent with TypeScript configuration       |
| `optimizeDeps.exclude: ["@inspector/ds"]`     | Prevents prebundling linked DS source                           | Keep DS available to StyleX transforms                      |
| `stylex.vite()`                               | Allows Vite to compile StyleX used by the DS                    | Keep source resolution available to the StyleX transform    |
| `tanstackRouter({ autoCodeSplitting: true })` | Generates route modules and enables route-level splitting       | Never hand-edit generated route trees                       |
| `viteReact()`                                 | Transforms React JSX and provides React development integration | Keep it in each React application                           |
| `target: "es2022"`                            | Defines the browser syntax baseline for emitted JavaScript      | Change only with a supported-browser decision               |
| `sourcemap: true`                             | Produces source maps for debugging emitted code                 | Consider production disclosure implications before changing |

### Web-only configuration

`apps/web` also uses:

- `tailwindcss()` because the application has Tailwind processing in addition to the StyleX-based DS architecture.
- `@tanstack/devtools-vite` outside test mode for router-development tooling.
- a dynamic development-only StyleX runtime import.
- `defaultPreload: "intent"`, which lets the router preload route work after a user shows intent to navigate. Preloading is not the same as making the route part of the HTML entry closure.

## Static and deferred dependency graphs

An import is a dependency-graph decision.

- A **static import** makes a module available when its importer is evaluated. Static dependencies can become part of the initial route or another eagerly loaded closure.
- A **dynamic import** creates an asynchronous boundary. The imported module is requested only when code executes that `import()` expression.
- A **route boundary** delays a route module until routing needs it.
- An **interaction boundary** delays optional behavior until the component policy requests it.

The initial-cost question is not “which emitted chunk has a large name?” A chunk name is an output assignment hint. The relevant question is which modules the HTML entry module and its module preloads require before first render.

Dynamic imports are not always beneficial. Do not defer a dependency that is required for correct or accessible first interaction. Use a boundary when all of these are true:

1. The dependency is not necessary for the first usable render.
2. There is a usable static state before it loads.
3. The deferred module contains every runtime import from the heavy dependency.
4. The component has an explicit loading, error, retry, focus, and remount strategy.

## Runtime boundaries in the Inspector

### Jazz runtime

`InspectorSessionProvider` is mounted at the root route and handles session state, route parameters, connection selection, and navigation. It does not import the Jazz React runtime.

`InspectorProvider` is mounted by `/conn/:connectionId` after the route validates the saved branch and schema-hash preferences for that connection. It imports `JazzClientProvider`, creates the runtime through `useInspectorRuntime`, and makes it available to child routes. This keeps Jazz work out of onboarding and connection-management paths while preserving one runtime for table and query descendants.

### Code editor

`CodeEditor` presents a usable controlled textarea while its CodeMirror implementation loads. The CodeMirror module is loaded through a shared module-scope promise, failed loads are retryable from a later mount, and focus is restored when the richer editor takes ownership.

The fallback is part of the feature contract, not decorative loading UI. A user can continue editing before CodeMirror becomes available.

### Reordering behavior

Data Grid and Tab View initially render non-reorderable usable content. Their DnD implementation is deferred. The static component owns markup; the deferred module owns DnD providers and hooks; a small dependency-free context bridges constrained slots between them.

The bridge must not use DOM discovery, positional matching, `MutationObserver`, or a sibling runtime to attach behavior to rendered elements. React components own their elements and attach behavioral refs directly. Adding a provider can remount a subtree, so focus and required user state must be restored by semantic identity.

### Row editor forms

Insert and edit row forms are deferred behind the detail-pane boundary. The table view does not load their form behavior until the user opens the relevant pane.

## Dependency roles

Dependencies are selected for a role and an owning layer, not simply because they are available in the workspace.

| Dependency group      | Examples                                 | Owner and implications                                                          |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| React runtime         | `react`, `react-dom`                     | Applications provide the shared runtime; DS declares peers                      |
| Component behavior    | `@base-ui/react`                         | DS wraps primitives to constrain APIs and preserve accessible behavior          |
| Styling               | `@stylexjs/stylex`, `@stylexjs/unplugin` | DS styles are transformed by consuming Vite applications                        |
| Product data runtime  | `jazz-tools`                             | Web application only; keep behind connection-required boundaries                |
| Routing               | `@tanstack/react-router`, router plugin  | Web and documentation apps own their route trees                                |
| Optional interactions | CodeMirror, DnD Kit                      | DS may own reusable integration, but imports must remain deferred when optional |
| Product data display  | `@tanstack/react-table`                  | Used where product or DS table responsibilities require it                      |
| Documentation         | Shiki, generated prop extraction tooling | Documentation app only; not a DS runtime concern                                |
| Build output          | Vite, tsup, TypeScript                   | Vite builds applications; tsup emits package artifacts and declarations         |
| Testing               | Vitest, Testing Library, JSDOM           | Verify component behavior, application behavior, and boundaries                 |

## Adding a dependency or export

Before adding a dependency, consider those questions in the feature checklist:

1. What capability does it add that current dependencies do not provide?
2. Which layer owns the capability: web application, design system, documentation application, or build tooling?
3. Is it needed for first render, first usable interaction, or only an optional interaction?
4. Does it introduce a worker, WASM, global state, CSS side effect, provider, or import-time initialization?
5. Should it be a runtime dependency, development dependency, or DS peer dependency?
6. Does it need a route or interaction import boundary?
7. Who owns its rendered elements, refs, focus, errors, and cleanup?

Before adding a design-system export, answer these questions:

1. Is it a reusable and constrained component, primitive, token, hook, or consumer-facing type?
2. Is the root barrel appropriate, or does a focused public subpath express a useful boundary?
3. Would re-exporting it statically make an intentionally deferred implementation reachable from a broad entry?
4. Does the design-system documentation application need a page or example for it?
5. Does the export map, tsup entry configuration, and package declaration output support the new public path?

## Validation

Use validation that matches the boundary changed:

| Change                                  | Evidence to collect                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| DS component or export                  | DS tests, typecheck, lint, tsup build, documentation prop generation when applicable                     |
| Vite resolution or StyleX configuration | Both application builds and source-consumption behavior                                                  |
| Deferred dependency                     | Static-import regression test, fallback behavior test, focus/state test, and production chunk inspection |
| Route boundary                          | Route behavior test and product build output inspection                                                  |
| Package metadata such as `sideEffects`  | Verify modules have no required import-time effects and inspect consumer build behavior                  |

Run the focused validation commands recorded in `AGENTS.md` and the relevant feature checklist. A passing package build does not prove the application resolves the same contract; a passing application build does not prove the publishable package artifact is valid.

## Glossary

| Term                    | Meaning                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Workspace package       | A package developed in the same PNPM repository and linked through `workspace:*`                            |
| Public barrel           | A module that intentionally re-exports supported public APIs from one import path                           |
| Export map              | The `package.json` `exports` declaration that defines allowed import paths and resolution conditions        |
| Export condition        | A named branch in an export map selected by a consumer or bundler, such as `inspector-source` or `import`   |
| Source contract         | Public imports resolve to package source for workspace application compilation                              |
| Distribution contract   | Public imports resolve to built `dist` artifacts for external consumers                                     |
| Peer dependency         | A dependency supplied by the consuming application, such as React for the design system                     |
| Static dependency graph | Modules reachable through static imports from an entry or loaded route                                      |
| Deferred closure        | The module graph loaded by one dynamic import boundary                                                      |
| Tree shaking            | Removal of unused exports when package structure and side-effect metadata make it safe                      |
| Side effect             | Work that happens merely by importing a module, such as registering global behavior or injecting styles     |
| Semantic identity       | A stable meaning-based identifier, such as a table or field identity, used to restore state across remounts |
