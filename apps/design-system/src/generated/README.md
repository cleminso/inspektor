# Generated Props

## Table of contents

- [Ownership](#ownership)
- [Generation](#generation)
- [Page responsibilities](#page-responsibilities)

## Ownership

`props.json` contains generated API metadata extracted from public exports in `packages/design-system`.

Do not edit `props.json` manually. Package TypeScript declarations, runtime parameter defaults, and JSDoc are authoritative.

## Generation

Run `pnpm gen:props` from `apps/design-system` to update the artifact. `pnpm check:props` fails when the generated output is stale.

## Page responsibilities

Documentation pages select prop names and presentation order. They do not redefine generated types, requiredness, defaults, or public descriptions.
