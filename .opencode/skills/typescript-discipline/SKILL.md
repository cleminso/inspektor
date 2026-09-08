---
name: typescript-discipline
description: Guides safe TypeScript modeling, narrowing, assertions, boundary validation, and derived types in Inspektor. Use when changing TypeScript configuration, domain or state models, reusable or public types, boundary parsing, or code that relies on assertions or custom type guards.
---

# TypeScript discipline

## Table of contents

- [Choose the model](#choose-the-model)
- [Parse boundaries](#parse-boundaries)
- [Narrow safely](#narrow-safely)
- [Derive related types](#derive-related-types)
- [Design function inputs](#design-function-inputs)
- [Preserve repository conventions](#preserve-repository-conventions)
- [Validate the change](#validate-the-change)

## Choose the model

1. Start with the simplest type for which every supported operation is total.
2. Strengthen the type when the loose type forces a non-null assertion, unchecked cast, or impossible-state error.
3. Use a discriminated union when variants carry different data or mutually exclusive states. Do not model those states as a boolean plus optional fields.
4. Use tuples or constrained object shapes when their structure makes invalid combinations unrepresentable.
5. Use branded primitives only when values with the same runtime representation are easy to confuse across domain boundaries. Validate before applying the brand and follow an existing local brand representation when one exists.
6. Do not claim an invariant the representation cannot enforce. A plain numeric duration can be negative, and a tuple array is not an even-length flat array.

## Parse boundaries

1. Identify whether the source is genuinely untyped at the boundary you own. Untyped JSON, storage blobs, messages, environment values, and network responses enter as `unknown`; preserve an established parser's output type.
2. Preserve types supplied by trusted Jazz, framework, generated-client, and library contracts. Do not erase them to `unknown` and parse them again without evidence that the contract is unsafe.
3. Parse untyped input at the outer boundary into a named domain type. Internal code trusts only the invariants established by that parser.
4. Reuse the schema system that already owns the boundary. Derive the TypeScript type from that schema when supported.
5. Do not add a new schema dependency when existing repository facilities or simple validation suffice. Do not maintain a schema, duplicate interface, and custom guard for the same shape.
6. Handle parse failure according to the boundary contract: return a typed failure for expected invalid input and throw a descriptive error for violated internal invariants.

## Narrow safely

Use the first applicable option:

1. Discriminant checks or exhaustive switches.
2. The `in` operator for object variants.
3. `typeof` or `instanceof` for primitives and class instances.
4. A custom type guard that verifies every fact claimed by its predicate.
5. A localized assertion after runtime validation or when an external type definition cannot express an already verified invariant.

Never use `as` or `!` only to silence an unexplained compiler error. First improve the source type, add a discriminant, parse the boundary, or restructure the control flow. `as const` is allowed for literal inference. Prefer `satisfies` when checking a value against a type while preserving its inferred literals.

When handling a union, make additions fail compilation. Use an exhaustive typed lookup or the established local `never` pattern. Do not introduce a helper solely to disguise an assertion.

## Derive related types

1. Treat Jazz schemas, generated clients, public component props, and authoritative domain types as sources of truth.
2. Before declaring a parallel interface, consider `Pick`, `Omit`, `Parameters`, `ReturnType`, `Awaited`, indexed access, or `typeof`.
3. Derive a type only when the relationship is semantic. Declare a separate domain type when two shapes may evolve independently.
4. Prefer typed lookup records for finite unions so missing and extra keys fail compilation.

## Design function inputs

Use an object parameter when multiple positional arguments share a type, optional arguments would affect ordering, call sites are unclear, or the input is expected to grow. Keep concise positional arguments when their roles are unambiguous. Do not redesign hot paths for speculative allocation savings; optimize only from evidence.

## Preserve repository conventions

- Use explicit boolean comparisons: `=== true` and `=== false`.
- Prefix native Node.js imports with `node:`.
- Preserve strict compiler options and package-specific settings. Do not relax strictness to make a change compile.
- Investigate package compatibility and migration impact before enabling a stricter compiler option across the workspace.
- Follow `create-inspector-component` for public design-system component APIs and `inspector-testing` for test boundaries.

## Validate the change

1. Run the narrowest affected package typecheck defined by `inspektor-workflow`.
2. Run focused tests when runtime parsing, control flow, or behavior changed. Type-only assertions are not substitutes for behavior tests.
3. Search the changed code for new `any`, `as`, non-null assertions, duplicate domain shapes, and hand-written guards. Verify each remaining use has evidence.
4. Confirm generated files and externally owned types were not hand-edited.
