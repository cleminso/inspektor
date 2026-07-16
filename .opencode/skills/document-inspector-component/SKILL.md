---
name: document-inspector-component
description: Generates and updates `apps/design-system` documentation for `@inspector/ds` components using registry metadata, executable raw-source examples, generated props, and Shiki code blocks. Use when adding a component page, changing a documented component API, updating examples, or fixing generated prop metadata.
---

# Document Inspector Component

## Quick start

1. Inspect the public package export and its matching Base UI API reference.
2. Add or update the component's `componentId` extraction entry.
3. Generate package-authoritative prop metadata.
4. Create executable examples paired with `?raw` source imports.
5. Add the content page, registry item, and static route.
6. Validate generation, rendering, types, and build output.

## Documentation workflow

- Start with an idempotency check across the page, examples, prop selection, registry, extractor, generated metadata, and route. Update only missing or stale parts; when everything matches the public API, run validation without creating duplicate files or entries.
- Add the component to `apps/design-system/src/lib/registry.ts` only when its page exists.
- Give component items a stable `componentId`; do not use readiness or placeholder status markers.
- Include title, route, description, package import path, and package source reference.
- Register `{ componentId, exportName, inheritedProps }` in `scripts/extract-props.mjs`.
- Add a failing extractor test when the component export shape or inherited-prop policy is new.
- Put page content under `src/components/content/components/{componentName}/`.
- Keep each executable example in its own camelCase TSX file.
- Import each example normally for preview and with `?raw` for displayed source.
- Use `PageHeader`, `Section`, `Example`, `CodeBlock`, and `PropsTable` rather than recreating page chrome.
- Add a static route under `src/routes/components/`; never hand-edit `routeTree.gen.ts`. Router generation may update the generated tree as a consequence of validation; review that generated change rather than recreating it manually.

## Props workflow

- Package TypeScript, runtime defaults, and JSDoc are authoritative.
- Page prop files contain only selected prop names in display order; select only props that are part of the design vocabulary.
- Use `getGeneratedProps(componentId, propNames)` to resolve rows.
- Do not override generated type, requiredness, default, description, or source.
- Group compound-component parts into separate API sections when their props differ.

## Examples and code

- Examples must import from `@inspector/ds` as consumers do.
- Show focused copyable usage; put preview-only layout in `Example`, not the example module.
- Keep preview and displayed code synchronized through paired normal and `?raw` imports.
- Reuse the shared Shiki highlighter; do not instantiate one per page.

## Validation

- `pnpm --filter inspector.design-system test`
- `pnpm --filter inspector.design-system gen:props`
- `pnpm --filter inspector.design-system check:props`
- `pnpm --filter inspector.design-system typecheck`
- `pnpm --filter inspector.design-system lint`
- `pnpm --filter inspector.design-system build`
- `pnpm --filter @inspector/ds build`

See [REFERENCE.md](REFERENCE.md) for page structure, compound APIs, and failure handling.
