# Engineering guidance

## Table of contents

- [Debugging](#debugging)
- [Performance and import boundaries](#performance-and-import-boundaries)
- [React](#react)
- [Referential stability](#referential-stability)

## Debugging

- Treat a reported cause as a hypothesis. Compare broken and working paths and isolate their smallest implementation difference before editing.
- Inspect runtime structure, computed styles, render fan-out, observers, layout reads, and DOM writes before changing rendering infrastructure.
- Do not change font loading, network hints, compositor hints, virtualization, or bootstrap behavior without evidence that the subsystem causes the defect.
- Confirm a regression test fails for the reported behavior rather than because its fixture or harness is incorrect.

## Performance and import boundaries

- Classify affected interactions as primary or optional before introducing lazy loading. Do not defer code required by a primary interaction without explicit approval.
- Define the user-visible performance invariant before optimizing bundle size.
- Prove that a deferred boundary does not commit a fallback when first interaction must be immediate.
- Prefer deferring heavy internals instead of a primary surface.
- Present measured trade-offs when bundle size and interaction immediacy conflict.
- Validate bundle impact and cold first-use behavior in a production browser build.
- Add a regression test for the user-visible invariant.
- Read `docs/importBoundaryPlaybook.md` before adding a heavy dependency, deferring optional behavior, or changing a dynamic import boundary.

## React

- Name props relative to their component context.
- Derive behavior from existing props; prefer enum or union props over mutually exclusive booleans.
- Prefer composition and compound components over broad data props or slot overrides.
- Use effects for synchronization with external systems, not derived state.
- Put user-action side effects in event handlers and return cleanup from subscriptions, listeners, observers, and imperative integrations.
- Use keys when remounting is the intended state reset.

## Referential stability

- Use `Stable<T>` only at shared boundaries where consumers intentionally rely on identity.
- Establish stability beside the mechanism that proves it: memoization, React state or ref containers, or a module-scope constant.
- Treat `asStable()` as a trust boundary, never as a type-error escape hatch. Cover each new proof boundary with an identity regression test.
- A stable reference is not immutable or a reactive version; consumers of mutable containers must subscribe to state.
- Include every meaningful input in memoization dependencies. A stable value must change whenever a consumer should be notified.
- Do not memoize without a benefiting consumer or boundary.
- Do not require branded third-party return types when the dependency cannot produce the brand; prove stability inside the owned boundary.
- Standard React hook types do not enforce stable dependencies; do not claim dependency-array enforcement without strict hook types that require `Stable<T>`.
