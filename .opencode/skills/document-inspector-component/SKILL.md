# Document Inspektor Component

## Table of contents

- [Quick start](#quick-start)
- [Documentation workflow](#documentation-workflow)
- [Playground and code](#playground-and-code)
- [Validation](#validation)

## Quick start

1. Inspect the public package export and the registry.
2. Create one representative playground or fixed preview.
3. Pair the preview with its exact consumer-facing source.
4. Add the content page, registry item, and static route.
5. Validate rendering, controls, types, and build output.

## Documentation workflow

- Start with an idempotency check across the package export, registry, page, playground, and route.
- Add a registry item only when its page exists. Keep its title, route, description, package import path, and package source reference current.
- Put page content under `src/components/content/components/{componentName}/`.
- Use `ComponentDocsPage` for every component page, including pages with fixed previews.
- Render one playground only. Do not add secondary example sections or generated props tables.
- Put interactive playground controls in the right dock through the `controls` prop. Fixed playgrounds may omit controls.
- Keep the component title and description in the center header. Reserve the right dock for controls and Reset.
- Add a static route under `src/routes/components/`; never hand-edit `src/routeTree.gen.ts`.
- Do not add a Best practices section without an explicit product decision and authored guidance.

## Playground and code

- Examples must import from `@inspektor/ds` as consumers do.
- Interactive playground state owns the preview, controls, and serialized source.
- Fixed playgrounds use one focused example module imported normally for preview and with `?raw` for displayed source.
- Keep preview-only layout in the page or playground, not the consumer example.
- Reuse `createPlaygroundSource` and the shared Shiki highlighter.
- The code island remains collapsed until its `Code` header is activated.

## Validation

- `pnpm --filter inspektor.design-system test`
- `pnpm --filter inspektor.design-system typecheck`
- `pnpm --filter inspektor.design-system lint`
- `pnpm --filter inspektor.design-system build`
- `pnpm --filter @inspektor/ds build` when package source or public APIs change

See [REFERENCE.md](REFERENCE.md) for page structure and completion criteria.
