# Seitu Assessment

## Question

Where, if anywhere, would Seitu solve a concrete Inspektor need better than the current implementation?

## Research areas

1. Seitu capabilities: supported primitives, runtime model, framework bindings, package cost, and limitations.
2. Application state: shared, persisted, browser-derived, and externally subscribed state in `apps/web`.
3. Reusable UI state: browser-derived and cross-component state in `packages/design-system` and its documentation app.
4. Existing architecture: installed dependencies and local abstractions that already cover candidate use cases.

## Synthesis

Rank concrete adoption candidates by fit and replacement cost. Separate genuine needs from local component state that should remain in React, then recommend adoption, a narrow trial, or no action.
