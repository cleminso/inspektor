# shadcn-cssinjs findings

## Table of contents

- [Scope and sources](#scope-and-sources)
- [Component and registry structure](#component-and-registry-structure)
- [Base UI wrapping](#base-ui-wrapping)
- [StyleX styles and tokens](#stylex-styles-and-tokens)
- [Props, refs, state, and render composition](#props-refs-state-and-render-composition)
- [shadcn and Tailwind conventions](#shadcn-and-tailwind-conventions)
- [Practical rules](#practical-rules)

## Scope and sources

This review covers the documentation and the linked `shadcn-labs/shadcn-cssinjs` source repository. The repository was checked directly because it is not indexed by DeepWiki.

Primary documentation:

- [Introduction](https://www.shadcn-cssinjs.com/docs)
- [Installation](https://www.shadcn-cssinjs.com/docs/installation.md)
- [Theming](https://www.shadcn-cssinjs.com/docs/theming.md)
- [Registry](https://www.shadcn-cssinjs.com/docs/registry.md)
- [Button documentation](https://www.shadcn-cssinjs.com/docs/components/button.md)
- [Documentation index](https://www.shadcn-cssinjs.com/llms.txt)

Primary source:

- [Repository](https://github.com/shadcn-labs/shadcn-cssinjs)
- [`registry.json`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry.json)
- [`lib/utils.ts`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/lib/utils.ts)
- [`registry/bases/stylex/tokens.stylex.ts`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/tokens.stylex.ts)
- [`registry/bases/stylex/button/button.tsx`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/button/button.tsx)
- [`registry/bases/stylex/button/button.stylex.ts`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/button/button.stylex.ts)
- [`registry/bases/stylex/switch/switch.tsx`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/switch/switch.tsx)
- [`registry/bases/stylex/dialog/dialog.tsx`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/dialog/dialog.tsx)

## Component and registry structure

- Authoring files live under `registry/bases/stylex/<component>/`, not directly under an application `components/ui` directory.
- A component normally has two colocated files: `<component>.tsx` for behavior and markup, and `<component>.stylex.ts` for `stylex.create()` rules. Examples include `button/button.tsx` beside `button/button.stylex.ts` and `dialog/dialog.tsx` beside `dialog/dialog.stylex.ts`.
- `registry.json` maps those upstream files to installation targets such as `components/ui/button/button.tsx` and `components/ui/button/button.stylex.ts`. This adds one folder level compared with the common stock shadcn target `components/ui/button.tsx`; imports consequently use `@/components/ui/button/button`.
- Components are `registry:ui` items. The shared token file is a `registry:lib` item named `stylex-tokens`, installed as `components/ui/tokens.stylex.ts`.
- Component entries declare npm dependencies and, where needed, `registryDependencies: ["stylex-tokens"]`. `pnpm registry:build` runs `shadcn build registry.json --output ./public/r` to create distributable registry payloads.
- Compound components remain in one component module. For example, `dialog.tsx` exports `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`, and related parts rather than creating a file per part.
- Not every item wraps Base UI. Presentational elements such as Card, Badge, and native form elements use intrinsic HTML; interactive primitives use Base UI where it supplies behavior and accessibility.

## Base UI wrapping

- Primitive imports are namespaced, for example `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"` and `Switch as SwitchPrimitive` from `@base-ui/react/switch`.
- Thin parts forward the primitive API almost unchanged and add a stable `data-slot`, as in `DialogPrimitive.Root`, `Trigger`, `Close`, and `Portal` in [`dialog.tsx`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/dialog/dialog.tsx).
- Styled parts destructure `className` and `style`, compute StyleX output, merge caller escape hatches, add `data-slot`, and spread remaining primitive props.
- Wrappers preserve compound composition rather than hiding primitive parts behind a broad configuration object. Dialog content composes Base UI Portal, Backdrop, Popup, and Close; Switch composes Root and Thumb.
- Base UI render state replaces Tailwind selectors that depend on a component's own generated state attributes. Switch maps `state.checked` to `styles.rootChecked` and `styles.thumbChecked`; Dialog maps `state.transitionStatus` to hidden transition styles.
- Transition behavior is represented by explicit StyleX states. Dialog considers Base UI's `starting` and `ending` statuses hidden, then applies opacity/transform rules from its style module.

## StyleX styles and tokens

- Every style module imports `* as stylex`, imports shared tokens relatively from `../tokens.stylex`, and exports one `styles = stylex.create({...})` object.
- Rules are semantic maps such as `base`, `focusable`, `default`, `sizeSm`, `rootChecked`, and `popupHidden`. Variant and size lookup records in the component replace class-variance-authority for core components.
- Pseudo-classes and media queries are expressed inside StyleX values. Button uses `:hover`, `:disabled`, and `:focus-visible`; Dialog uses `@media (min-width: 640px)` in `maxWidth`.
- [`tokens.stylex.ts`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/registry/bases/stylex/tokens.stylex.ts) defines typed `colors` and `radius` groups with `stylex.defineVars`. Color values point to stock shadcn variables such as `var(--background)`, `var(--primary)`, and `var(--ring)`. Radius values derive `sm`, `md`, `lg`, and `xl` from `--radius`.
- Light/dark values remain in global CSS under `:root` and `.dark`; StyleX tokens are typed references to those variables, not a second theme store. Existing shadcn themes and generators therefore remain compatible.
- [`x()`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/lib/utils.ts) filters conditional style entries and delegates to `stylex.props()`, returning both `className` and inline `style`. [`cx()`](https://github.com/shadcn-labs/shadcn-cssinjs/blob/main/lib/utils.ts) only joins the generated class and a caller class escape hatch.
- Intrinsic wrappers merge both StyleX outputs: `className={cx(p.className, className)}` and `style={{ ...p.style, ...style }}`. Some Base UI state-callback wrappers return only `.className` and pass the caller's `style` separately, so authors should verify whether a selected StyleX rule emits inline values before copying that pattern.
- The build requires StyleX Babel and PostCSS plugins with matching options. `@stylex;` is placed in global CSS, and the StyleX PostCSS plugin runs before Tailwind if Tailwind is also present.

## Props, refs, state, and render composition

- Props derive from the rendered element or Base UI part with `React.ComponentProps<"button">` or `React.ComponentProps<typeof DialogPrimitive.Popup>`. Wrappers commonly omit `className` and restore it as `string` because Base UI permits a state callback while the wrapper owns that callback.
- Component-specific props are narrow unions, such as Button's `variant` and `size`, layered over native button props. Variant-to-style records are typed as `Record<ButtonVariant, StyleXStyles>`.
- The source targets React 19 and does not use `React.forwardRef`. Refs are already part of `React.ComponentProps` and pass through `...props` to intrinsic or Base UI elements. A wrapper must avoid destructuring away `ref`; no separate forwarded-ref wrapper is required.
- `className` state functions are the normal mechanism for checked, active, highlighted, and transition states. This is required because StyleX cannot express Tailwind-like self `data-state` or peer/group selectors in the same way.
- Polymorphism uses Base UI's `render` API rather than Radix's `asChild`. Button declares `render?: useRender.RenderProp` and calls `useRender`, defaulting to `<button type="button" />`; passing an anchor element changes the rendered element while Base UI merges props and behavior.
- `render` is not equivalent to accepting an arbitrary `as` string. It is element-based composition and should preserve Base UI's prop-merging contract. The Button docs demonstrate using it for a link.
- Prop spread order is deliberate. Button constructs internal props before `...props`, allowing normal native props and the React 19 ref to flow into `useRender`; styled wrappers separately control `className`, `style`, variants, and slots.
- Stable `data-slot`, `data-size`, and `data-variant` attributes are retained for identification, external styling, and composition even though internal state styling is handled through StyleX and Base UI state.

## shadcn and Tailwind conventions

Retained from shadcn:

- Registry-first source distribution through `npx shadcn add`; consumers own and edit installed files.
- `registry.json`, `registry:ui`/`registry:lib`, registry dependencies, and generated `/r/*.json` payloads.
- Semantic CSS variable names, `.dark` class theming, OKLCH-compatible values, and the shared `--radius` convention.
- Familiar component names, variants, sizes, compound exports, Lucide icons, `data-slot` attributes, and caller `className`/`style` escape hatches.
- Composition of larger components from smaller registry components and direct derivation from native/primitive prop types.

Replaced or not applicable:

- Tailwind utility strings are not used in registry component implementations. Styles live in `.stylex.ts` files and compile to atomic CSS.
- `cn()` plus `tailwind-merge` is not the component style-composition mechanism. Registry components use `x()` for StyleX rules and `cx()` only to append external class names. The docs site itself still uses Tailwind and retains `cn()`.
- CVA is not the standard variant mechanism for these StyleX components. Typed records select StyleX rules instead.
- Radix primitives and `asChild` are replaced by Base UI primitives and `render`/`useRender`.
- Tailwind `group-*`, `peer-*`, arbitrary data-state selectors, and utility responsive prefixes do not translate directly. Use Base UI state callbacks, explicit conditional StyleX rules, and StyleX media-query keys.
- Tailwind remains optional and interoperable. Installation documentation shows it can continue styling the host app and docs while StyleX handles registry components; StyleX's PostCSS extraction must run first.

## Practical rules

1. Place each component in `components/ui/<name>/` with `<name>.tsx` and `<name>.stylex.ts`; keep compound parts together.
2. Derive public props from the intrinsic element or exact Base UI part. Omit only properties the wrapper must narrow or own.
3. Let React 19 refs pass through `React.ComponentProps` and `...props`; do not add `forwardRef` by habit.
4. Wrap interactive behavior with Base UI and preserve its compound part structure. Use intrinsic HTML when no primitive behavior is needed.
5. Put static, variant, pseudo-class, and responsive styles in `stylex.create()`. Put colors and radii behind `stylex.defineVars()` references to semantic CSS custom properties.
6. Use `x()` for StyleX composition. Merge caller `className` with `cx()` and caller inline styles after StyleX's returned `style`.
7. Use Base UI `className={(state) => ...}` for primitive state and transition styling; do not mechanically port Tailwind `data-state`, group, or peer selectors.
8. Use Base UI `render` for polymorphism instead of adding `asChild` or an `as` prop.
9. Preserve shadcn's registry metadata, source ownership, semantic tokens, familiar variants, and `data-slot` hooks; do not preserve Tailwind-specific implementation techniques.
