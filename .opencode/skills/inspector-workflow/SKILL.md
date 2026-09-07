---
name: inspector-workflow
description: Plans, implements, validates, debugs, optimizes, and reviews Inspektor repository changes using the correct scope and package gates. Use for implementation, debugging, performance work, feature completion, public API or package-boundary changes, validation, review, or commit preparation.
---

# Inspektor workflow

## Table of contents

- [Classify the request](#classify-the-request)
- [Prepare](#prepare)
- [Plan and implement](#plan-and-implement)
- [Validate](#validate)
- [Review](#review)
- [Commit readiness](#commit-readiness)

## Classify the request

- **Review only:** report findings without editing or validation.
- **Scoped edit:** apply the requested local change and run focused checks.
- **Feature completion:** complete the affected feature and run affected-package checks.
- **Commit readiness:** run the complete review and validation gate.

Do not promote work to a broader mode without an explicit request. Separate adjacent findings from the requested scope unless they concern security, data loss, a broken build, or a direct regression.

## Prepare

1. Read `AGENTS.md` and the instructions nearest the affected files.
2. Record `git status --short`, the staged paths, and relevant staged and working-tree diffs with read-only commands.
3. Preserve every index entry that existed at task entry. Never use an editing or Git operation that changes it.
4. Identify affected packages, public contracts, generated outputs, and applicable skills.
5. Read [validation.md](references/validation.md). For bugs, rendering defects, React component, API, lifecycle, or identity work, performance optimization, or import-boundary changes, also read [engineeringGuidance.md](references/engineeringGuidance.md).

## Plan and implement

- Delegate independent file groups only when they do not share production files or generated output.
- Keep shared production files and generated artifacts under one owner.
- Do not parallelize builds when one package consumes another package's output.
- Preserve existing formatting and exclude unrelated churn.
- After a multi-hunk or replacement edit, inspect the resulting file or semantic diff before validation.

## Validate

- Run only checks invalidated by changes since their last successful result.
- Follow the focused-to-broad order in [validation.md](references/validation.md).
- Use `inspector-testing` for test boundaries, fixtures, and browser verification.
- Stabilize source APIs before generating metadata; generate and check it once.

## Review

Use one component-level review and one complete-diff review. Delegate the complete-diff pass to `reviewer` whenever it is available for any implementation. For feature completion, substantial refactors, cross-package behavior, and commit readiness, delegate both passes. Give the reviewer fresh context with the acceptance criteria, repository baseline, affected files, implementation summary, validation results, and separate staged and unstaged diffs. Ask it to adversarially verify that the implementation matches the accepted scope and to inspect correctness, architecture, security, lifecycle behavior, test quality, and unnecessary complexity. Prefer a different model family when the harness supports one; lack of model diversity does not skip independent review.

The primary agent owns triage. Apply only findings supported by repository evidence. Repeat the complete-diff review only when a finding changes production behavior.

Consult `oracle` before committing to a consequential unresolved choice with multiple credible approaches affecting architecture, public APIs, data integrity, security, cross-package behavior, or lifecycle behavior. Do not consult it when evidence or established conventions settle the decision.

## Commit readiness

- Run `pnpm -r --if-present format`, affected-package lint, and affected-package typecheck.
- Run affected-package suites and broader build checks required by [validation.md](references/validation.md).
- Inspect staged and working-tree diffs separately without modifying the index.
- Reject staged deletions whose replacement paths are untracked or unstaged.
