# Document Inspektor Component

## Table of contents

- [Quick start](#quick-start)
- [Documentation workflow](#documentation-workflow)
- [Scenarios and source](#scenarios-and-source)
- [Validation](#validation)

## Quick start

1. Inspect the public package export and documentation registry.
2. Identify the accepted Inspektor usage scenarios worth teaching.
3. Implement each scenario as a focused TSX module.
4. Compose guidance and scenarios in the component MDX page.
5. Add the registry item and static route.
6. Validate behavior, source fidelity, types, and build output.

## Documentation workflow

- Start with an idempotency check across the package export, registry, MDX page, scenario modules, and route.
- Add a registry item only when its page exists. Keep its title, route, description, and package source reference accurate.
- Put page content under `src/content/components/{componentName}/page.mdx`.
- Put executable scenarios under the colocated `demos/` directory using camelCase file names.
- Keep MDX outside `src/routes`. Add a static `.tsx` route under `src/routes/components/` and never hand-edit `src/routeTree.gen.ts`.
- Use MDX for prose and scenario ordering. Keep state, hooks, substantial data, and StyleX in strict TSX modules.
- Author only meaningful sections. Do not add empty Anatomy, Accessibility, or Best practices placeholders.
- Do not add generated props tables unless the product explicitly adopts exhaustive API documentation.

## Scenarios and source

- Scenarios must import public `@inspektor/ds` paths as consumers do.
- Each scenario demonstrates one accepted usage or a useful comparison, not one arbitrary prop combination.
- Import the scenario normally for rendering and with `?raw` for displayed source.
- Render scenarios through `ComponentDemo`; do not duplicate executable code in MDX fences or handwritten strings.
- Keep preview-only framing in `ComponentDemo`, not in the consumer example.
- Keep scenarios independent so focus, portals, IDs, and state do not leak between examples.
- Use the shared Shiki code renderer. Source remains visible directly below its executable preview.
- Respect the closed styling contract: no `className`, inline `style`, raw CSS values, or package-private runtime imports.

## Validation

- Focused registry, `ComponentDemo`, or `AppShell` tests when their contracts change; do not add page-level component correctness tests
- `pnpm --filter inspektor.design-system test`
- `pnpm --filter inspektor.design-system typecheck`
- `pnpm --filter inspektor.design-system lint`
- `pnpm --filter inspektor.design-system build`
- Interactive browser verification in both color schemes and relevant viewport widths
- `pnpm --filter @inspektor/ds build` when package source or public APIs change

See [REFERENCE.md](REFERENCE.md) for page structure and completion criteria.
