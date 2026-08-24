---
name: ponytail-review
description: Reviews diffs for removable complexity while preserving comments and JSDoc that encode ownership boundaries, invariants, failure contracts, and architectural intent. Use for over-engineering reviews, simplification passes, and commit preparation.
---

# Ponytail Review

Review diffs for unnecessary complexity. The best outcome is a shorter diff that preserves behavior and the reasoning needed to maintain it.

## Review process

1. Read the complete staged and unstaged diff.
2. Trace callers and cross-file invariants for every implementation proposed for deletion.
3. Search for newly single-use helpers, obsolete compatibility paths, dead mocks, redundant effects, and speculative flexibility.
4. Classify comments and JSDoc with the documentation decision below.
5. Run a fresh pass over the resulting diff. Stop only when it finds no meaningful reduction.

## Documentation decision

Comments are not complexity merely because similar information exists in architecture documentation. Local reasoning prevents maintainers from violating a boundary while editing the code that enforces it.

For every comment or JSDoc block:

1. Does it only narrate visible syntax or repeat names? Delete it.
2. Does it explain ownership, an invariant, a failure contract, why the boundary exists, or why a tempting alternative is wrong? Keep it beside the code, even when broader documentation covers the same architecture.
3. Is the reasoning useful but verbose? Tighten it without removing the constraint.
4. Is it stale or contradicted by the implementation? Update it or report the mismatch; never delete it merely to make the diff smaller.

Never recommend deleting documentation solely because the symbol is private, the code is readable, or a separate document discusses the same system. Before recommending deletion, state what decision would be lost. If a non-obvious decision would be lost, keep the documentation.

## Finding format

Use one line per finding:

`file:L<line>: <tag> <what>. <replacement>.`

Tags:

- `delete:` dead code, unused flexibility, or obsolete compatibility behavior.
- `stdlib:` hand-written behavior covered by the standard library.
- `native:` code or a dependency covered by the platform.
- `yagni:` an abstraction with one implementation or configuration nobody sets.
- `shrink:` identical behavior with fewer, clearer lines.

End with `net: -<N> lines possible.`

If there is nothing to cut, say `Lean already. Ship.` and stop.

## Boundaries

- Scope is unnecessary complexity. Route correctness, security, accessibility, and performance issues belong to their dedicated reviews.
- Never remove input validation at trust boundaries, error handling that prevents data loss, accessibility behavior, or regression coverage for an intentional contract.
- A shorter implementation is not simpler when it hides an invariant or moves required reasoning away from the code it governs.
- Do not apply changes during a review unless the user explicitly requests fixes.
