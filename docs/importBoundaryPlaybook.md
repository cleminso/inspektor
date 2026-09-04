# Import Boundary Playbook

## Table of contents

- [Purpose](#purpose)
- [Current model](#current-model)
- [Core rules](#core-rules)
- [Package and consumer resolution](#package-and-consumer-resolution)
- [Decision process](#decision-process)
- [Deferred interaction pattern](#deferred-interaction-pattern)
- [State and lifecycle rules](#state-and-lifecycle-rules)
- [Testing and validation](#testing-and-validation)
- [Documentation rules](#documentation-rules)
- [Patterns to avoid](#patterns-to-avoid)
- [Review checklist](#review-checklist)

## Purpose

Use this playbook when an import increases initial application work, when an optional interaction depends on a large library, or when changing an existing dynamic import boundary.

The goal is not to maximize code splitting. The goal is to keep the initial dependency graph aligned with what the user needs for the first usable render while preserving declarative React ownership, accessibility, and predictable interaction behavior.

## Current model

The application consumes `@inspektor/ds` through its public barrel. A static import from any exported component can therefore make that dependency eligible for an initial application chunk, even when only one optional component uses it.

The Inspector application limits its StyleX transform hook to `packages/design-system/src`. The design system is the only source owner that imports StyleX, so Rolldown can reject unrelated application and dependency modules before invoking the JavaScript plugin hook. The application suppresses only Rolldown's relative plugin-timing diagnostic after applying this boundary; all other build checks remain enabled. Expand or remove the filter before introducing StyleX imports under another owner.

Data Grid and Tab View use the established deferred interaction pattern:

1. The static component renders complete, non-reorderable content.
2. A post-mount dynamic import loads the reorder implementation.
3. The deferred implementation wraps the static content with the DND provider.
4. A small static context bridges deferred sortable components to the owning component parts.
5. Each sortable hook attaches its returned ref directly to the element it owns.
6. Focus is restored when introducing the deferred wrapper remounts the interactive subtree.

The original performance issue was caused by static `@dnd-kit` imports in public design-system modules. A discarded fix mounted DND as a sibling runtime and registered existing elements through DOM discovery. In Tab View, positional matching between controlled values and discovered elements caused tabs to jump and reorder unpredictably. The sibling runtime also made behavior depend on private markup, mutation observers, and external element registration.

## Core rules

### Keep the static graph minimal

- Put imports required for the first usable render in the static component module.
- Put optional, heavy interaction dependencies in a dedicated dynamically imported module.
- Keep every import from the deferred dependency in that deferred module, including sensors, modifiers, helpers, hooks, and overlays.
- Use `import type` when only types are needed. Confirm that no runtime value is imported through the type boundary.
- Do not statically re-export a deferred implementation from the public package barrel.

### Preserve component ownership

- Attach behavioral refs to the React component that renders the corresponding element.
- Keep hooks under the provider that owns their behavior.
- Pass constrained component slots or render callbacks through a lightweight context when static parts need deferred hooks.
- Keep the bridge dependency-free. Importing the bridge from both static and deferred modules must not import the heavy library into the static graph.

### Keep public behavior stable

- Preserve the public controlled API while optional behavior loads.
- Render usable content before the deferred module is available.
- Do not show enabled styling, attributes, or affordances before the behavior is ready.
- Separate `configured`, `ready`, and `enabled` states when they represent different conditions.
- Reject invalid identifiers, duplicate order values, and other ambiguous controlled input instead of silently disabling behavior.

### Prefer direct code over generic infrastructure

- Keep a loader local to its feature until several features need exactly the same lifecycle and error semantics.
- Do not create a generic deferred-module hook only to remove two small, readable effects.
- Do not add custom bundle inspection to the normal build unless the project adopts a strict performance budget that must fail automation.

## Package and consumer resolution

- Verify the package export selected by each consumer before interpreting a library build. A source export means the consumer does not execute the package bundler output.
- Keep source and distribution contracts explicit. Use a package-specific source condition for workspace consumers and `import` for the built ESM artifact.
- Preserve the design-system module graph in distribution output so StyleX variable definitions, dynamic imports, and consumer tree-shaking retain their source boundaries.
- Add component subpath exports at broad application boundaries when the public barrel retains unrelated modules or creates excessive development traversal.
- Use a bundler-native hook filter when a transform has one explicit source owner. Keep the filter aligned with ownership so valid source files cannot bypass the transform.
- Declare `sideEffects` only after verifying that modules do not rely on import-time CSS registration, globals, polyfills, or singleton setup.
- Prefer ESM-only package output when no CommonJS consumer exists. Removing CommonJS simplifies package output but does not reduce application cost when the application consumes source.
- Treat chunk names as assignment hints rather than ownership reports. Measure the HTML entry's complete static module-preload closure and each deferred closure.
- Do not use manual static chunk grouping to claim an initial-load improvement. Moving the same modules between preloaded chunks does not remove network, parse, or evaluation work.

## Decision process

Before introducing a dynamic import:

1. Identify the outer boundary where the dependency enters the initial graph.
2. Identify the first user-visible behavior that actually requires the dependency.
3. Confirm that a functional static state exists without it.
4. Measure or inspect the production output to confirm the dependency is material enough to defer.
5. Choose the smallest module boundary that contains all heavy runtime imports.
6. Determine whether resolving the import changes the rendered element hierarchy.
7. Define how focus, selection, scroll, uncontrolled state, and refs behave across that transition.
8. Add behavioral tests before replacing the existing integration.

Do not defer a dependency when it is required for correctness, accessibility, or the first usable interaction. Do not split small dependencies only because dynamic imports are available.

## Deferred interaction pattern

### Static module responsibilities

- Public props and types.
- Static markup and accessible behavior.
- Loading the deferred module after mount.
- Distinguishing configuration from readiness.
- Capturing and restoring user state affected by the boundary transition.
- Rendering the deferred component only when configuration is valid and the module is ready.

### Deferred module responsibilities

- Every runtime import from the heavy dependency.
- Provider, sensor, modifier, plugin, and overlay setup.
- Hooks that depend on the deferred provider.
- Reorder calculations and dependency-specific event interpretation.
- Small adapter components that return existing static markup through render callbacks.

### Static bridge responsibilities

- Dependency-free React context.
- Narrow component slot types.
- Safe static defaults such as `null` component slots or missing indices.
- No DOM queries, observers, library imports, or feature state unrelated to the bridge.

### Boundary transition

Introducing a provider above existing content changes the React hierarchy and can remount the subtree. Treat this as an explicit transition:

- Record focused semantic identity before enabling the deferred wrapper.
- Restore focus in a layout effect after the wrapper mounts.
- Prefer stable semantic keys over DOM identity.
- Add a regression test for any state that must survive the transition.
- Do not claim DOM identity is preserved unless the architecture proves it.

## State and lifecycle rules

- Start the dynamic import from one clearly defined policy. Prefer deterministic post-mount loading for an interaction expected on the current screen.
- Do not combine unconditional post-mount loading with redundant pointer and focus triggers.
- Cache an in-flight module promise at module scope so repeated component instances share one request.
- Reset the cached promise when loading fails so a later mount can retry.
- Report load failures with a component-specific error instead of silently degrading.
- Guard asynchronous state updates when the requesting component unmounts.
- Keep drag visual state owned by the dependency hook when possible. Do not duplicate it in provider callbacks and static component state.
- Include every meaningful input in memoization and effect dependency sets.

## Testing and validation

### Required behavioral tests

- Static import does not initialize the deferred dependency.
- Static content is usable before the deferred module resolves.
- Enabled styling and attributes appear only after the implementation is ready.
- Sortable refs attach to their owning rendered elements.
- Reordering reports the complete controlled order.
- Cancellation restores the expected controlled order when applicable.
- Focus returns to the equivalent interactive element after the boundary transition.
- Duplicate or otherwise invalid controlled identifiers fail explicitly.

### Validation commands

- Run focused component behavior tests.
- Run the design-system typecheck.
- Run focused lint for every changed component and bridge file.
- Build the design-system package to verify dynamic chunk emission.
- Build the product application and inspect the emitted chunk list when changing an import boundary.

Production output inspection is a review step, not a permanent custom build script, unless the codebase adopts an explicit automated bundle budget.

## Documentation rules

When adding or changing an import boundary, document why, how, and what near the loader:

- Why the dependency must not remain in the static graph, including the original user or performance problem.
- How the deferred module reconnects behavior without violating React ownership.
- What lifecycle transition maintainers must preserve, including remount and focus behavior.

Document discarded approaches when they failed in a non-obvious way. State the observed failure and the architectural cause so a future maintainer or agent does not restore it as an apparent simplification.

Update the corresponding `docs/todo/{elementName}.md` checklist with the settled implementation decision and validation coverage.

## Patterns to avoid

- Static imports from a heavy optional dependency in a public component module.
- Dynamic imports that leave helper, sensor, modifier, or hook imports in the static module.
- DOM discovery used to reconnect React-owned behavior.
- Matching controlled values to elements by position.
- `MutationObserver` used as a substitute for React refs and props.
- Passing external elements to hooks when the hook provides an owning ref.
- Sibling runtimes controlling elements outside their declarative subtree without a documented library requirement.
- Styling an interaction as enabled before its implementation is ready.
- Silent fallback for duplicate controlled identifiers.
- Swallowed dynamic import failures.
- Multiple competing sources for drag or transition state.
- Custom source-map or manifest checks in the normal build without a project-level performance budget.

## Review checklist

- [ ] Is the dependency optional for the first usable render?
- [ ] Are all runtime imports from the heavy dependency inside one deferred module?
- [ ] Is the static bridge free of the deferred dependency?
- [ ] Does each behavioral hook attach to the element rendered by its owning component?
- [ ] Is the loading policy singular and explicit?
- [ ] Are `configured`, `ready`, and `enabled` states unambiguous?
- [ ] Are invalid controlled values reported explicitly?
- [ ] Does the boundary transition remount content?
- [ ] Are focus and other required user states restored semantically?
- [ ] Is the dynamic import failure visible and retryable from a later mount?
- [ ] Do tests cover static import, ref ownership, reorder outcome, and focus restoration?
- [ ] Does the production build emit the optional implementation separately?
- [ ] Are rejected approaches and their failure modes documented?
