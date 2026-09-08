# Meta StyleX practices

This document records the public StyleX patterns that guide Inspektor's baseline, tokens, component styles, and CSS extraction.

## Table of contents

The sections describe the StyleX model, loading order, component practices, browser normalization, rationale, and sources.

- [Model](#model)
- [Loading flow](#loading-flow)
- [Practices](#practices)
- [What removing Preflight exposed](#what-removing-preflight-exposed)
- [Why](#why)
- [Sources](#sources)

## Model

Meta's public pattern combines a small application baseline with complete, element-local StyleX rules. StyleX generates atomic CSS; it does not normalize browser defaults.

## Loading flow

Applications load CSS from broad document concerns to narrow component presentation.

1. Fonts
2. `@inspektor/ds/baseline.css`, defined by [[lat.md/designSystemBaseline#Design-system browser baseline]]
3. Application globals
4. Generated StyleX component CSS

Each layer becomes more specific in responsibility: assets, shared browser normalization, application policy, then component presentation.

## Practices

These practices keep component styling local while leaving document-wide policy in application CSS.

1. Put styles on the element they affect through `stylex.props`; avoid styling at a distance.
2. Wrap native elements and normalize their presentation inside the owning component.
3. Keep document selectors and browser normalization in ordinary global CSS.
4. Load that baseline once from the application CSS entry point, before generated StyleX rules.
5. Use CSS layers to keep reset and base rules below component rules.
6. Define tokens with `defineVars` and apply themes to explicit subtrees.
7. Extract static CSS through the consumer build; use runtime injection only for development.
8. Keep components correct without relying on the application baseline.

## What removing Preflight exposed

Removing Tailwind Preflight removed the reset rules. Native margins, borders, typography, and form-control presentation became visible.

No equivalent author rules overrode those defaults. The missing layer was a browser baseline within the CSSOM.

## Why

This separates document policy from component presentation. It limits cascade surprises, keeps components portable, preserves static CSS output, and makes every global side effect explicit.

## Sources

These public documents and repositories support the StyleX and browser-rendering practices recorded here.

- [Thinking in StyleX](https://stylexjs.com/docs/learn/thinking-in-stylex/)
- [StyleX Vite integration](https://stylexjs.com/docs/learn/installation/vite/)
- [StyleX Next.js example](https://github.com/facebook/stylex/tree/main/examples/example-nextjs)
- [StyleX documentation global CSS](https://github.com/facebook/stylex/blob/main/packages/docs/src/styles/globals.css)
- [React Strict DOM element defaults](https://github.com/react/react-strict-dom/blob/main/packages/react-strict-dom/src/web/runtime.js)
- [Constructing the DOM and CSSOM](https://web.dev/articles/critical-rendering-path/constructing-the-object-model)

Meta's product source is private; this document records the pattern demonstrated by its public documentation, examples, and maintained repositories.
