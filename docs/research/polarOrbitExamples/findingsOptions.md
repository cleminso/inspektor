# Single-source live React examples and displayed source

## Table of contents

- [Question and repository context](#question-and-repository-context)
- [Evaluation criteria](#evaluation-criteria)
- [Option comparison](#option-comparison)
- [Detailed findings](#detailed-findings)
- [Recommended model](#recommended-model)
- [Implementation constraints](#implementation-constraints)
- [Decision and escalation points](#decision-and-escalation-points)
- [Sources](#sources)

## Question and repository context

The goal is to drive both a live React preview and its displayed source from one handwritten example definition in a Vite, React, and TanStack Router documentation app.

The relevant app is `apps/design-system`:

- It uses Vite with `@vitejs/plugin-react`, `@tanstack/router-plugin`, and the StyleX Vite plugin.
- It uses strict TypeScript and already includes `vite/client` in `tsconfig.app.json`.
- Its build runs both `vite build` and `tsc`.
- The documentation shell is handwritten TSX. It has no MDX or browser compiler dependency.
- `src/components/primitives/example.tsx` is an empty placeholder, so there is no shipped example data model to preserve.
- TanStack Router generates routes from files under the configured route tree. Example modules should therefore live outside `src/routes`, such as `src/examples`, and be consumed by route/page components.

TanStack Router does not materially constrain how a page imports preview modules. It only matters that example files do not accidentally become route files and that normal static imports remain visible to Vite's module graph.

## Evaluation criteria

For this internal handwritten TSX documentation app, the useful criteria are:

1. One authoritative example body, so preview and displayed source cannot drift.
2. Normal TypeScript checking and editor support for examples.
3. Normal React Fast Refresh and Vite production builds.
4. No browser execution of arbitrary source strings.
5. Minimal dependencies, plugin code, generated files, and custom declarations.
6. Displayed source that resembles what an engineer should copy.
7. A straightforward path from a few explicit examples to registry-driven discovery if the example count grows.

## Option comparison

| Option | One authoritative body | Type checking | Vite/Fast Refresh fit | Added machinery | Display fidelity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Manually duplicated code strings | No | Preview only; string can drift or be invalid | Preview is normal | Very low | Fully curated | Reject as default |
| Normal import plus `?raw` import | Yes | Full, ordinary TSX | Native Vite path | Very low | Exact file contents | Adopt |
| Source files transformed into component/source records | Yes | Depends on transform API and declarations | Good if plugin is correct | Medium | Exact or transform-defined | Defer |
| Runtime compilation | Yes | No build-time guarantee for the executed string | Bypasses the normal module pipeline | High | Exact input string | Reject |
| MDX | Potentially | Weaker for custom exports; separate MDX typing | Supported with plugin configuration | Medium to high | Good for prose, not automatically self-showing | Defer unless docs become prose-first |

## Detailed findings

### 1. Manually duplicated code strings

Shape:

```tsx
function BasicButtonExample() {
  return <Button>Save</Button>;
}

const basicButtonSource = `
<Button>Save</Button>
`;
```

#### Benefits

- No Vite-specific import syntax or plugin.
- The displayed snippet can omit wrapper functions, imports, setup code, and implementation details.
- The snippet can be shorter and more pedagogical than the executable component.

#### Constraints and failure modes

- There are two authoritative representations. Renaming a prop or changing behavior in the preview does not update the string.
- TypeScript checks the preview but does not parse or typecheck the code string.
- Reviewers must manually compare two values.
- Formatting tools treat the string as string content unless an embedded-language formatter is configured.
- Tests can only reduce drift by parsing or snapshotting the string, which adds more machinery than using the source file directly.

#### Fit

This is the smallest implementation but not the smallest reliable model. It is reasonable only when the displayed snippet intentionally differs from executable code and that curation is worth accepting duplication.

### 2. Normal TSX import beside Vite `?raw`

Shape:

```tsx
import BasicButtonExample from "./basicButtonExample.tsx";
import basicButtonSource from "./basicButtonExample.tsx?raw";

const example = {
  Preview: BasicButtonExample,
  source: basicButtonSource,
};
```

The example file is ordinary TSX:

```tsx
import { Button } from "@inspector/ds";

export default function BasicButtonExample() {
  return <Button>Save</Button>;
}
```

Vite explicitly documents `?raw` as importing an asset as a string. The same file without the query remains a normal TSX module and passes through TypeScript/JSX transpilation, the React plugin, StyleX, and the normal module graph. The query-qualified request is a distinct raw-string representation handled by Vite.

#### Benefits

- The `.tsx` file is the single authoritative example body.
- TypeScript, linting, formatting, editor navigation, React Fast Refresh, and production bundling continue to operate on a normal component module.
- The raw string shows the source engineers authored, not compiled JavaScript.
- No runtime compiler, parser, code generation step, or custom Vite plugin is required.
- `apps/design-system/tsconfig.app.json` already includes `vite/client`, which Vite documents as providing client-side asset import type shims. No additional `*.tsx?raw` declaration should be needed.
- A source edit invalidates dependencies of the normal module and raw request through Vite's module graph, keeping preview and source synchronized.

#### Constraints and failure modes

- The consumer writes two imports for one file. This is duplicated wiring, not duplicated example code.
- The displayed source is the whole file, including imports, component wrappers, helper constants, and exports. This is usually appropriate for copyable examples but may be noisier than a hand-curated fragment.
- The raw source string is bundled into the documentation app. That adds approximately the source text size plus JavaScript string encoding. This is acceptable for small internal examples, but large example catalogs may benefit from route-level lazy loading.
- The raw import is Vite-specific rather than standard ESM. This app is already Vite-specific through its config and router integration, so portability has little practical value here.
- Importing a TSX file as raw does not apply TypeScript/JSX or StyleX transforms to the displayed string. That is desirable when the display should match authored code.
- Syntax highlighting is separate. A code highlighter may add package weight or build-time processing, but it does not affect the single-source model.

#### Scaling without a custom plugin

Vite documents `import.meta.glob`, eager imports, named/default import selection, and custom queries. A registry can pair executable modules and raw strings by identical path keys:

```tsx
const previews = import.meta.glob("./**/*.example.tsx", {
  eager: true,
  import: "default",
});

const sources = import.meta.glob("./**/*.example.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});
```

This removes repeated import statements while retaining one example file. Vite requires glob arguments to be literals, and this registry loses some per-file inferred component specificity unless it adds a narrow record type. Explicit imports are simpler for a small handwritten catalog.

### 3. Source files transformed into component/source records

This option uses a custom Vite plugin or convention so one import returns both executable and source representations:

```tsx
import example from "./basicButtonExample.tsx?example";

example.Preview;
example.source;
```

A plugin can resolve `?example` and load a generated wrapper that imports the original module normally and imports the same path with `?raw`. Vite documents `resolveId`, `load`, virtual modules, file transforms, plugin ordering, and HMR hooks for this purpose.

#### Benefits

- One import at each call site.
- A central convention can enforce filenames, metadata, source cleanup, or lazy loading.
- The generated record can become the basis of a registry if many pages need identical wiring.

#### Constraints and failure modes

- This solves cosmetic duplication of two imports by introducing plugin code, module-ID rules, declaration files, plugin-order concerns, and HMR/build behavior that must be maintained.
- Appending an export such as `source` directly to every `.example.tsx` in a `transform` hook creates a TypeScript language-service mismatch: the source file does not declare that export even though Vite injects it. A query module with a declared module shape avoids that mismatch but still needs custom declarations.
- A plugin must avoid recursion when its generated wrapper imports the original file and raw form.
- Plugin ordering matters. A pre-transform can preserve authored TSX; a post-transform may capture compiled code instead. The Vite plugin guide documents `enforce` ordering and recommends checking built-in features before creating a plugin.
- Correct source maps are required if the plugin rewrites executable code rather than only generating a wrapper.
- Custom HMR handling may be needed if Vite does not infer every relationship from generated imports. Vite exposes `handleHotUpdate`, but adding it increases maintenance.
- Vite plugin behavior must work in both dev and build. Hooks such as `configureServer` do not run in production builds, so a server-only implementation would be incorrect.

#### Fit

This can be reliable, but it is not the smallest model. It becomes justified only after explicit paired imports or paired globs create repeated, measurable friction, or when source extraction rules become a real requirement.

### 4. Runtime compilation

Shape:

```tsx
const source = `export default function Example() { ... }`;
const compiled = Babel.transform(source, {
  presets: ["react", "typescript"],
}).code;
```

The app must then execute the compiled output and supply React, design-system components, and any imports through a custom module environment, `Function`, `eval`, blob/data module URLs, an iframe, or a sandbox package.

#### Benefits

- The exact displayed string can be compiled, so preview and display share one value.
- It enables interactive playgrounds where users edit examples in the browser.

#### Constraints and failure modes

- Babel's documentation says `@babel/standalone` should normally not be used for production and identifies real-time user-code compilation and prototypes as its intended browser use cases.
- Compilation is only part of the problem. Normal example imports such as `@inspector/ds` are not automatically resolved through Vite's build-time module graph. A runtime module registry or bundler is needed.
- Runtime-transpiled source is not typechecked by the app's `tsc` build. Type errors and missing bindings become runtime failures.
- React Fast Refresh does not naturally own components created by an ad hoc compiler/evaluator.
- Compiler code and any sandbox/runtime loader increase the client bundle.
- Error mapping, source maps, async modules, CSS/StyleX handling, context providers, and cleanup become application responsibilities.
- Executing strings commonly requires `eval()` or `Function()`. MDN documents that CSP blocks both unless `script-src` allows `'unsafe-eval'`. Weakening CSP for static internal docs is an avoidable security tradeoff.
- Trusted authors reduce untrusted-code risk but do not remove compiler, module-resolution, CSP, debugging, and bundle costs.

#### Fit

Reject for static handwritten examples. Reconsider only if editable, user-controlled playground behavior becomes a product requirement, and isolate execution rather than coupling it to the documentation app's React root.

### 5. MDX

MDX compiles markdown plus JSX and ESM into JavaScript components. Its official Vite integration uses `@mdx-js/rollup`. When combined with `@vitejs/plugin-react`, MDX documents that the MDX plugin must run in the pre phase and the React plugin must include MDX extensions.

Shape:

```mdx
import { Button } from "@inspector/ds"

export function BasicButtonExample() {
  return <Button>Save</Button>
}

## Basic button

<BasicButtonExample />
```

#### Benefits

- Strong authoring model for prose-first component documentation.
- Documentation and live JSX can coexist in one file.
- MDX compiles to components and supports imports, exports, component mappings, and layouts.
- The compilation happens in Vite rather than in the browser.

#### Constraints and failure modes

- MDX does not by itself make a JSX example self-displaying. Rendering `<BasicButtonExample />` and showing its source still requires one of these:
  - Duplicate the JSX in a fenced code block.
  - Import the MDX or a separate TSX file with `?raw` and extract a region.
  - Add a remark/recma plugin that captures example source.
- Adding MDX therefore does not remove the central preview/source problem unless the app also adopts raw imports or AST transformation.
- It introduces `@mdx-js/rollup`, likely `@types/mdx`, Vite plugin ordering, React plugin include changes, editor tooling, and a content-component mapping.
- MDX's documentation states that custom named exports cannot be typed automatically. They require wildcard or per-file declarations. Ordinary TSX examples retain stronger inference.
- MDX is a programming language and its security documentation says untrusted authors are unsafe. Internal trusted authors make this manageable, but there is no security benefit over ordinary TSX.
- The app's pages, sections, and registry are already handwritten React/TypeScript. MDX would create a second authoring language without a demonstrated need for long-form markdown content.

#### Fit

Do not add MDX solely to solve example source display. Adopt it only if the broader documentation model becomes prose-first and markdown ergonomics justify the integration. Even then, normal TSX example modules plus `?raw` remain a simple way to embed examples in MDX pages.

## Recommended model

Use dedicated ordinary TSX example files, each imported normally for the preview and with `?raw` for display.

Suggested file placement:

```text
apps/design-system/src/
  examples/
    button/
      basicButtonExample.tsx
  components/
    primitives/
      example.tsx
```

Suggested local definition:

```tsx
import type { ComponentType } from "react";

import BasicButtonExample from "@/examples/button/basicButtonExample.tsx";
import basicButtonSource from "@/examples/button/basicButtonExample.tsx?raw";

interface ExampleDefinition {
  Preview: ComponentType;
  source: string;
}

export const basicButtonExample = {
  Preview: BasicButtonExample,
  source: basicButtonSource,
} satisfies ExampleDefinition;
```

The exact shared type should reflect whether examples accept injected props. If examples need no inputs, `ComponentType` is enough. If the preview shell injects theme, width, or state controls, define those props once and type every preview against them.

This model is smallest because Vite already provides both required representations:

- Normal `.tsx` import: executable component transformed by the existing pipeline.
- `?raw` import: authored file text returned as a string.

The only duplication is a pair of import statements. That is less machinery and lower risk than a custom transform, browser compiler, or MDX pipeline.

## Implementation constraints

### Keep examples outside the route tree

TanStack Router's plugin generates route configuration through the Vite dev and build processes based on route files. Store examples under `src/examples`, not `src/routes`. Routes should import page components, and page components or registries should import example definitions.

### Prefer one default preview export

Use one default component per example file. This makes explicit imports and a possible `import.meta.glob(..., { import: "default" })` migration straightforward.

### Treat the whole file as the copyable unit

Start by displaying the full raw file. It is deterministic and needs no parser. Keep each example file focused so imports and the component are useful copyable context.

Avoid marker comments and regex extraction until a concrete example requires hidden harness code. Regex-based extraction introduces syntax edge cases and another representation rule. If hidden setup becomes common, separate setup into imported helpers so the example file remains clean.

### Preserve static imports

Prefer explicit imports for a small catalog. They provide direct editor navigation and clear route chunk ownership. If route-level code splitting matters, examples imported by a lazily loaded route remain in that route's graph. An eager global glob can pull every example and every raw string into one chunk, so do not centralize eagerly without checking output.

### Keep formatting deterministic

The raw string reflects the file on disk. Let the repository formatter own TSX formatting. Strip only an optional final newline at render time if the code block requires it; do not rewrite source text into a second stored value.

### Keep syntax highlighting independent

The example definition should expose a plain `source: string`. The code block may tokenize it synchronously, lazily load a highlighter, or render plain `<pre><code>`. Do not couple source acquisition to the highlighting library.

### Verify both module forms

When implementing the model, verify:

1. `pnpm --filter inspector.design-system typecheck`
2. `pnpm --filter inspector.design-system build`
3. Editing an example updates both preview and displayed source in development.
4. The production output includes the preview and raw string only in the intended route chunk.

## Decision and escalation points

Adopt explicit normal plus `?raw` imports first.

Move to paired `import.meta.glob` maps if catalog registration becomes repetitive and eager/lazy chunk behavior is understood.

Build a custom `?example` Vite module only if the app needs centralized metadata, source-region extraction, or enforced conventions that paired imports and globs cannot express cleanly.

Adopt MDX only for a broader prose-first authoring decision, not for source synchronization alone.

Adopt runtime compilation only for an editable playground requirement with an explicit execution and isolation design.

## Sources

1. Vite, **Static Asset Handling**, documents `?raw` string imports and `vite/client` typing for asset imports: https://vite.dev/guide/assets
2. Vite, **Features**, documents React Fast Refresh, transpile-only TypeScript, TSX support, client types, `import.meta.glob`, eager/default imports, custom query support, and literal glob constraints: https://vite.dev/guide/features
3. Vite, **Plugin API**, documents built-in-first guidance, custom file transforms, virtual modules, hook behavior, plugin ordering, HMR hooks, and dev/build differences: https://vite.dev/guide/api-plugin
4. MDX, **Getting started**, documents the Vite integration through `@mdx-js/rollup`, React plugin ordering/configuration, TypeScript setup, and trusted-author security boundary: https://mdxjs.com/docs/getting-started/
5. MDX, **Using MDX**, documents compilation to JavaScript components, imports/exports, and limitations around automatic typing of custom exports: https://mdxjs.com/docs/using-mdx/
6. Babel, **@babel/standalone**, documents browser compilation use cases and recommends build-system transpilation rather than standalone Babel for production: https://babeljs.io/docs/babel-standalone
7. MDN, **Content-Security-Policy: script-src**, documents that `eval()` and `Function()` are blocked unless `'unsafe-eval'` is allowed: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src
8. React, **Writing Markup with JSX**, documents JSX as a JavaScript syntax extension transformed into plain JavaScript: https://react.dev/learn/writing-markup-with-jsx
9. TanStack Router, **File-Based Routing**, documents filesystem-driven route generation through the bundler's dev and build processes: https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing
