# Base UI v1.6.0 Button API reference page rendering

## Table of contents

- [Scope and source baseline](#scope-and-source-baseline)
- [Route and page composition](#route-and-page-composition)
- [Metadata selection and build pipeline](#metadata-selection-and-build-pipeline)
- [Button metadata inputs](#button-metadata-inputs)
- [API reference React rendering](#api-reference-react-rendering)
- [Source and navigation links](#source-and-navigation-links)
- [Rendered Button result](#rendered-button-result)
- [Source index](#source-index)

## Scope and source baseline

The primary source is the `mui/base-ui` GitHub tag `v1.6.0`, which dereferences to commit `b34551d644f2e58ebf8fc1050d949f6654ceca6c`. All Base UI paths below are project-relative to that snapshot.

The docs application pins `@mui/internal-docs-infra` to `0.11.1-canary.22` in `docs/package.json`. That package identifies its source commit as `c0380f22916148bebba5dee261c1a2a3a9211a5e` in `mui/mui-public`; references to its implementation use that immutable commit. The package is an implementation dependency, while the tagged Base UI repository remains the authority for the route, configuration, component source, generated artifact, and local rendering components.

The rendered page and its Markdown representation were also inspected to confirm the visible result:

- Page: <https://base-ui.com/react/components/button#api-reference>
- Markdown representation: <https://base-ui.com/react/components/button.md>

## Route and page composition

### Route file

`docs/src/app/(docs)/react/components/button/page.mdx` is the Next.js App Router page for `/react/components/button`. The `(docs)` route group does not contribute a URL segment. The API section is explicit: the `## API reference` heading is followed by `import { TypesButton } from './types'` and `<TypesButton />`. The page's other local imports, `DemoButtonHero` and `DemoButtonLoading`, render demos and do not feed the API reference. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/page.mdx)

`docs/src/mdx-components.tsx` supplies the application-wide MDX element map. For this section, its `h2` mapping wraps the heading with `HeadingLink`, preserving the generated `id="api-reference"`. The same map provides `TypeRef`, `TypePropRef`, code, table, and preformatted-code components reused when generated type HAST is converted to React elements. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/mdx-components.tsx)

### Layout and provider path

`docs/src/app/(docs)/layout.tsx`, symbol `Layout`, wraps route children in `QuickNav.Container` and `DocsProviders` before placing them in the main content area. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/layout.tsx)

`docs/src/components/DocsProviders.tsx`, symbol `DocsProviders`, includes `TypesDataProvider` from `@mui/internal-docs-infra/useType`. This provider receives registrations made by `useTypes`, allowing generated type references such as `Button.State` to resolve to page-local metadata. [Base UI source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/DocsProviders.tsx) · [provider source](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/useType/TypesDataProvider.tsx)

## Metadata selection and build pipeline

### 1. The Button-specific selector

`docs/src/app/(docs)/react/components/button/types.ts` contains the complete page-specific selection:

- It imports the named `Button` export from `@base-ui/react/button`.
- It imports Base UI's configured `createTypes` factory from `docs/src/utils/createTypes`.
- It exports `TypesButton = createTypes(import.meta.url, Button)`.

There is no manually assembled Button prop object in the page. The imported binding is the selector, and `import.meta.url` identifies the colocated `types.ts`/`types.md` resource. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.ts)

### 2. Base UI configures the generic factory

`docs/src/utils/createTypes.tsx` defines `createTypes` by calling `createTypesFactory` with these significant slots:

- `TypesTable: ReferenceTable`
- `components`: the local `mdxComponents` map, with `pre` overridden by `CodeBlock.Root` plus `CodeBlockPreComputed`
- `TypePre: CodeBlock.PreInline`
- `ShortTypeCode: TableCode`
- `DefaultCode: TableCode`
- `typeRefComponent: 'TypeRef'`
- `typePropRefComponent: 'TypePropRef'`

This file binds generic docs-infra metadata to Base UI's visual components. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/createTypes.tsx)

### 3. The loader precomputes metadata

`docs/next.config.mjs` applies `@mui/internal-docs-infra/pipeline/loadPrecomputedTypes` to every `src/app/**/types.ts` file in both Turbopack and webpack. `typesGenerationOptions` supplies `ordering` from `docs/src/utils/typeOrder.mjs`, description replacements, `.next/docs-infra` IPC storage, and parent-index synchronization. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs)

The loader's `loadPrecomputedTypes` symbol performs this sequence:

1. `parseCreateFactoryCall` finds `createTypes(import.meta.url, Button)`, requires the first argument to be exactly `import.meta.url`, maps the `Button` binding to external module `@base-ui/react/button`, and records single-component structured input `Button`.
2. The package export map in `packages/react/package.json` resolves `@base-ui/react/button` to `packages/react/src/button/index.ts`, whose named export forwards `Button` from `./Button`.
3. `loadServerTypes({ sync: true, output: 'hastCompressed' })` extracts and formats the TypeScript API, regenerates the colocated `types.md`, highlights its structured fields, and returns exports plus related types and anchor metadata.
4. The loader builds `precompute` with `exports`, `additionalTypes`, `variantOnlyAdditionalTypes`, `variantTypeNames`, `singleComponentName`, and `anchorMap`.
5. It rewrites the factory call to inject that `precompute` value and rewrites the actual component import so browser/server rendering does not load `Button` merely to display documentation.

[Base UI package export](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/package.json) · [Button entry point](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/index.ts) · [loader source](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts) · [factory-call parser](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/parseCreateFactoryCall/parseCreateFactoryCall.ts)

### 4. The factory chooses `Button`

In `abstractCreateTypes`, the decisive expression is equivalent to `exportName || singleComponentName || Object.keys(precompute.exports)[0]`. This call is single-component mode and the loader recorded `singleComponentName: 'Button'`, so `targetExportName` is `Button`. `TypesComponent` converts only `precompute.exports.Button` and the associated additional types from compressed HAST to JSX, then renders the configured `ReferenceTable` with `type`, `additionalTypes`, and `multiple: false`. [Source](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/abstractCreateTypes/abstractCreateTypes.tsx)

This means `types.md` is a generated, checked representation and validation artifact, not a Markdown file fetched and parsed by the browser. Page rendering consumes metadata injected into the transformed `types.ts` module.

### 5. Extraction and organization

The internal pipeline resolves the selected entry point, creates a TypeScript program, and calls `parseFromProgram` from `typescript-api-extractor`. `formatComponentData` builds component metadata from custom props and conventionally named metadata exports. `organizeTypesByExport` makes the component/hook/function the main export and associates dotted raw types ending in `.Props`, `.State`, and related suffixes with that export. For this module the result is main export `Button` with `Button.Props` and `Button.State` as additional types. [resolver](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesMeta/resolveLibrarySourceFiles.ts) · [extractor integration](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesMeta/processTypes.ts) · [component formatter](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesMeta/formatComponent.ts) · [type organization](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesText/organizeTypesByExport.ts)

## Button metadata inputs

### `packages/react/src/button/Button.tsx`

Symbols `Button`, `ButtonProps`, `ButtonState`, and namespace `Button` provide the primary metadata. The component JSDoc supplies “A button component that can be used to trigger actions” and “Renders a `<button>` element.” `ButtonProps` contributes `focusableWhenDisabled` and its `@default false`; the namespace aliases expose `Button.Props` and `Button.State`; and `ButtonState.disabled` contributes the state type's property and description. Default initializers in `Button` also establish `focusableWhenDisabled = false` and `nativeButton = true`. [Source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx)

### `packages/react/src/internals/types.ts`

`ButtonProps` extends `NativeButtonProps` and `BaseUIComponentProps<'button', ButtonState>`. `NativeButtonProps.nativeButton` supplies its description and `@default true`. `BaseUIComponentProps` supplies the documented `className`, `render`, and `style` contracts and descriptions, parameterized with `ButtonState`, which is why rendered types refer to `Button.State`. The generated API deliberately presents these custom Base UI props rather than the full inherited native button attribute surface. [Source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/types.ts)

### `packages/react/src/button/ButtonDataAttributes.tsx`

The conventionally named `ButtonDataAttributes` enum is discovered by `formatComponentData` using the component name plus the `DataAttributes` suffix. Its `disabled = 'data-disabled'` member and JSDoc produce the data-attribute reference. No `ButtonCssVars` export exists, so the Button metadata has an empty `cssVariables` object. [Source](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/ButtonDataAttributes.tsx)

### `docs/src/utils/typeOrder.mjs`

The `ordering` object controls output order. Button's component-specific props fall into `__EVERYTHING_ELSE__`, while shared `className`, `style`, and `render` are explicitly placed at the end. `data-disabled` also has an explicit data-attribute position. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/typeOrder.mjs)

### `docs/src/app/(docs)/react/components/button/types.md`

The generated file records the extractor result as Markdown: five props, `data-disabled`, `Button.Props`, `Button.State`, and canonical-to-flat aliases. Its header names `types.ts` as the generator and gives the scoped validation command. It is rewritten by `syncTypes` when extracted metadata changes; production dependency tracking also treats it as a build input. [Base UI artifact](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md) · [sync implementation](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/syncTypes/syncTypes.ts)

## API reference React rendering

### Main dispatch: `ReferenceTable`

`docs/src/components/ReferenceTable/ReferenceTable.tsx` exports `ReferenceTable`. It calls `useTypes(props)` and dispatches on `type.type`. Button metadata has `type === 'component'`, so the active branch renders:

- `ReferenceAccordion` when `data.props` is non-empty.
- `AttributesReferenceTable` when `data.dataAttributes` is non-empty.
- `CssVariablesReferenceTable` only when CSS variables exist; this is skipped for Button.
- `AdditionalTypes` when related types exist.

The file also imports callable/class renderers (`ParametersReferenceTable`, `PropertiesReferenceAccordion`, and `MethodsReferenceAccordion`), but those branches are inactive for Button. Because `multiple` is false, the main component description is not repeated above the visual table even though it exists in generated metadata and `types.md`. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceTable.tsx)

`useTypes` returns the supplied metadata and registers the main type, aliases, additional types, and property anchors with `TypesDataProvider`. That registration supports `TypeRef` lookups from highlighted type expressions. [Source](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/useTypes/useTypes.ts)

### Direct active import graph

The direct imports that carry Button API data or render it are:

- `page.mdx` → `TypesButton` from `./types`.
- `types.ts` → `Button` from `@base-ui/react/button` as extraction input and `createTypes` as the component factory.
- `createTypes.tsx` → `createTypesFactory`, `ReferenceTable`, `mdxComponents`, `CodeBlock`, `CodeBlockPreComputed`, and `TableCode`. `CodeBlockPreComputed` handles precomputed MDX code nodes embedded in generated descriptions/examples. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/CodeBlock/CodeBlockPreComputed.tsx)
- `ReferenceTable.tsx` → `useTypes` for the injected data and, in Button's component branch, `ReferenceAccordion`, `AttributesReferenceTable`, and `AdditionalTypes`.
- `ReferenceAccordion.tsx` → `EnhancedProperty` as its data contract, `stringOrHastToString` for accessible text, `visuallyHidden`, `Link`, `Accordion`, `CodeBlock`, `DescriptionList`, and `TableCode`. [Link](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Link.tsx) · [CodeBlock](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/CodeBlock/CodeBlock.tsx)
- `AttributesReferenceTable.tsx` → `EnhancedEnumMember` as its data contract plus `Table`, `Accordion`, and `TableCode` for the two responsive presentations.
- `AdditionalTypes.tsx` → `EnhancedTypesMeta` as its data contract plus `Link`, `Code`, and `CodeBlock` for re-export prose and raw type code. [Code](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Code.tsx)
- `mdxComponents` and `DocsProviders` → `TypeRef`, `TypePropRef`, and `TypesDataProvider`, which connect highlighted HAST references to the metadata registered by `useTypes`.

Imports in those files used only for hook, function, class, or CSS-variable branches are not part of Button's active render path; they are identified separately rather than presented as Button renderers.

### Props: `ReferenceAccordion`

`docs/src/components/ReferenceTable/ReferenceAccordion.tsx` renders a faux table using local `Accordion` primitives. Each prop becomes a `<details>` item with a summary row for name, short type, default, and expand icon. Expanded content uses `DescriptionList` for linked name, description, detailed type in `CodeBlock.Root`, default, and example. The prop anchor is built as `${partName.replace('.', '')}-${name}`, such as `Button-focusableWhenDisabled`. `TableCode` supplies inline code styling, while `stringOrHastToString` creates accessible type text. [ReferenceAccordion](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceAccordion.tsx) · [Accordion primitives](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Accordion.tsx) · [DescriptionList](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/DescriptionList.tsx) · [TableCode](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/TableCode.tsx) · [CodeBlock](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/CodeBlock/CodeBlock.tsx)

### Data attributes: `AttributesReferenceTable`

`docs/src/components/ReferenceTable/AttributesReferenceTable.tsx` renders the same metadata in two responsive forms: an `Accordion` list on narrow layouts and semantic local `Table` primitives on wider layouts. For Button both forms receive the single `data-disabled` enum member. [AttributesReferenceTable](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/AttributesReferenceTable.tsx) · [Table primitives](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Table.tsx)

### Additional types: `AdditionalTypes`

`docs/src/components/ReferenceTable/AdditionalTypes.tsx` filters related metadata to raw types and renders a section for each:

- `Button.Props` is recognized as a re-export. In single-component mode its link target is `#api-reference`, and the text identifies flat alias `ButtonProps`.
- `Button.State` renders highlighted `formattedCode` inside `CodeBlock.Root`.

Each section receives its generated slug as `id` and a Hide/Back control whose behavior changes after hash navigation. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/AdditionalTypes.tsx)

### Highlighted type references

The factory's `typeRefComponent: 'TypeRef'` setting maps linked names in generated HAST to `docs/src/components/TypeRef/TypeRef.tsx`. `TypeRef` looks up metadata through `useType`; raw related types can open an interactive popover, while unavailable or non-raw targets remain anchors. The configured `TypePropRef` component supports property-definition and property-reference anchors, although the Button factory does not enable the optional `linkProps` mode. [TypeRef](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/TypeRef/TypeRef.tsx) · [TypePropRef](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/TypePropRef/TypePropRef.tsx)

## Source and navigation links

The links labeled “View as Markdown” and “View source” are rendered beside the page subtitle, not by `ReferenceTable`.

`docs/src/components/Subtitle/Subtitle.tsx` composes `MarkdownLink` and `ViewSourceLink`. `mdx-components.tsx` maps the page's `<Subtitle>` element to this component. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Subtitle/Subtitle.tsx)

`MarkdownLink` reads `usePathname()` and appends `.md`, so this route links to `/react/components/button.md`. [Source](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Subtitle/MarkdownLink.tsx)

`ViewSourceLink` accepts only a single slug beneath `/react/components/` or `/react/utils/`. It combines the slug with `SOURCE_CODE_REPO` and `v${LIB_VERSION}`. `docs/next.config.mjs` sets the repository to `https://github.com/mui/base-ui` and reads `LIB_VERSION` from the root `package.json`, whose tagged value is `1.6.0`. The resulting link is <https://github.com/mui/base-ui/tree/v1.6.0/packages/react/src/button>. [ViewSourceLink](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Subtitle/ViewSourceLink.tsx) · [environment configuration](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs) · [root package version](https://github.com/mui/base-ui/blob/v1.6.0/package.json)

Within the API reference, the `## API reference` heading links to `#api-reference`, prop names link to their generated detail anchors, highlighted type names link to related type slugs, and `Button.Props` links back to `#api-reference` because it is a re-export of the main component props.

## Rendered Button result

The inspected page confirms that the component branch renders these rows in order:

1. `focusableWhenDisabled`: short type `boolean`, default `false`.
2. `nativeButton`: short type `boolean`, default `true`.
3. `className`: short type `string | function`, no default.
4. `style`: short type `React.CSSProperties | function`, no default.
5. `render`: short type `ReactElement | function`, no default.

Expanding a row reveals its full union, description, and default when present. The prop table is followed by the `data-disabled` attribute reference, then `Button.Props` as a re-export and `Button.State` as highlighted TypeScript. This matches the tagged `types.md` artifact while using the interactive React renderers described above.

## Source index

### Base UI v1.6.0

- `docs/src/app/(docs)/react/components/button/page.mdx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/page.mdx)
- `docs/src/app/(docs)/react/components/button/types.ts`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.ts)
- `docs/src/app/(docs)/react/components/button/types.md`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/react/components/button/types.md)
- `docs/src/app/(docs)/layout.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/%28docs%29/layout.tsx)
- `docs/src/utils/createTypes.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/createTypes.tsx)
- `docs/src/utils/typeOrder.mjs`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/utils/typeOrder.mjs)
- `docs/src/mdx-components.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/mdx-components.tsx)
- `docs/src/components/ReferenceTable/ReferenceTable.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceTable.tsx)
- `docs/src/components/ReferenceTable/ReferenceAccordion.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/ReferenceAccordion.tsx)
- `docs/src/components/ReferenceTable/AttributesReferenceTable.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/AttributesReferenceTable.tsx)
- `docs/src/components/ReferenceTable/AdditionalTypes.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/ReferenceTable/AdditionalTypes.tsx)
- `docs/src/components/TypeRef/TypeRef.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/TypeRef/TypeRef.tsx)
- `docs/src/components/TypePropRef/TypePropRef.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/TypePropRef/TypePropRef.tsx)
- `docs/src/components/Subtitle/Subtitle.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Subtitle/Subtitle.tsx)
- `docs/src/components/Subtitle/MarkdownLink.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Subtitle/MarkdownLink.tsx)
- `docs/src/components/Subtitle/ViewSourceLink.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/src/components/Subtitle/ViewSourceLink.tsx)
- `docs/next.config.mjs`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/docs/next.config.mjs)
- `packages/react/src/button/index.ts`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/index.ts)
- `packages/react/src/button/Button.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/Button.tsx)
- `packages/react/src/button/ButtonDataAttributes.tsx`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/button/ButtonDataAttributes.tsx)
- `packages/react/src/internals/types.ts`: [GitHub](https://github.com/mui/base-ui/blob/v1.6.0/packages/react/src/internals/types.ts)

### `@mui/internal-docs-infra` 0.11.1-canary.22

- Package source commit: <https://github.com/mui/mui-public/tree/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra>
- `packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadPrecomputedTypes/loadPrecomputedTypes.ts)
- `packages/docs-infra/src/abstractCreateTypes/abstractCreateTypes.tsx`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/abstractCreateTypes/abstractCreateTypes.tsx)
- `packages/docs-infra/src/useTypes/useTypes.ts`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/useTypes/useTypes.ts)
- `packages/docs-infra/src/pipeline/loadServerTypes/loadServerTypes.ts`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypes/loadServerTypes.ts)
- `packages/docs-infra/src/pipeline/loadServerTypesMeta/formatComponent.ts`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesMeta/formatComponent.ts)
- `packages/docs-infra/src/pipeline/loadServerTypesText/organizeTypesByExport.ts`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/loadServerTypesText/organizeTypesByExport.ts)
- `packages/docs-infra/src/pipeline/syncTypes/syncTypes.ts`: [GitHub](https://github.com/mui/mui-public/blob/c0380f22916148bebba5dee261c1a2a3a9211a5e/packages/docs-infra/src/pipeline/syncTypes/syncTypes.ts)
