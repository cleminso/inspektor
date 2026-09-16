# Design-system package mental model

This document explains what `@inspektor/ds` emits and how its build keeps runtime compilation, declarations, StyleX, and deferred modules separate.

## Table of contents

The sections cover package artifacts, source formats, the TSDown choice, the build pipeline, type safety, and commands.

- [Purpose](#purpose)
- [Package output](#package-output)
- [Source formats](#source-formats)
- [Why TSDown](#why-tsdown)
- [Build pipeline](#build-pipeline)
- [Type safety](#type-safety)
- [Build commands](#build-commands)

## Purpose

`@inspektor/ds` provides reusable components and the consumer application assembles them into product features.

## Package output

The distribution contains executable modules, public type declarations, source maps, and preserved deferred boundaries.

- **ESM** `.js`: executable component code
- `.d.ts`: TypeScript descriptions of the public API
- **Source maps**: connect generated JavaScript to source files
- **Deferred modules**: code such as Data Grid reordering and CodeMirror that consumer bundlers can load separately

A consumer resolving the package distribution uses `.js` at runtime and `.d.ts` while type-checking. The package is private and is not configured for publication.

## Source formats

The package starts with typed component source and emits JavaScript modules that consumer tools can process.

- **TSX**: TypeScript containing JSX component markup. Browsers cannot execute it directly.
- **ESM**: standard JavaScript using import and export. Bundlers and modern browsers understand it.

## Why TSDown

The choice is not based on JavaScript compilation speed alone. Checked TypeScript declarations dominate an empty-cache build, so TypeScript checking was the bottleneck.

TSDown fits because it:

- emits an unbundled ESM module graph through Rolldown and Oxc;
- preserves StyleX variable-definition module identities for the consumer's StyleX compiler;
- preserves dynamic-import boundaries and gives consumer bundlers module-level tree-shaking inputs;
- keeps runtime compilation separate from TypeScript's semantic checking and declaration emission;
- provides a runtime-only build without weakening the default correctness gate.

tsup could also be configured around an unbundled JavaScript build and a separate TypeScript declaration pass. The benefit comes from the resulting pipeline and module boundaries rather than from replacing one capable build tool with another.

## Build pipeline

The package build emits runtime modules first, then checks the source and emits declarations.

1. TSDown starts from the four public entries, including the focused brand entry.
2. Rolldown and Oxc remove TypeScript types and convert the reachable TSX and TypeScript files to unbundled ESM modules.
3. Dynamic imports remain separate modules for consumer bundlers.
4. TypeScript performs the semantic check and emits matching declarations.

StyleX remains uncompiled so source and distribution modules retain the identities its compiler requires. The consuming application compiles StyleX and owns final CSS extraction, as described in [[lat.md/stylexBestPractices#Meta StyleX practices#Loading flow]].

## Type safety

The package build does not use TypeScript's `noCheck` option or TSDown's declaration generator. Both can emit declarations without proving that the source is semantically valid.

Instead, `tsc -p tsconfig.build.json` performs one checked declaration-emission pass after TSDown emits JavaScript. A successful package build therefore proves source type correctness and produces the runtime and declaration artifacts together.

The separate `typecheck` command remains useful when output files are not needed.

## Build commands

The package exposes separate commands for the complete build, runtime-only output, and type checking without output.

- `pnpm build` emits runtime modules, checks TypeScript semantics, and emits declarations. This is the package correctness gate.
- `pnpm build:runtime` emits runtime modules only. It is useful when declarations and a semantic check are intentionally unnecessary.
- `pnpm typecheck` checks source types without producing output files.

The workspace declares Node `^22.18.0 || >=24.11.0` because TSDown requires that runtime range.
