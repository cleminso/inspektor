# Polar Orbit examples — live preview and displayed source

## Table of contents

- [Why the values are separate](#why-the-values-are-separate)
- [Evidence](#evidence)
- [Risks](#risks)
- [Recommended model for Inspector](#recommended-model-for-inspector)
- [Implementation constraints](#implementation-constraints)
- [Escalation points](#escalation-points)
- [Sources](#sources)

## Why the values are separate

Polar Orbit's `Example` component accepts two independent inputs:

```tsx
code?: string
children: ReactNode
```

`children` renders the live preview. `code` is sent to a client-side `CodeBlock`, where Shiki highlights it and `navigator.clipboard.writeText` copies it.

No author explicitly documented this split. The best-supported inference is a representation mismatch plus curation:

- React needs executable elements; Shiki and the clipboard need a string.
- React elements do not retain a reliable, author-formatted JSX source at runtime.
- The displayed snippet can omit preview-only wrappers, layout constraints, and helper components so the reader copies the relevant API usage.
- Orbit has no JSX serialization, AST extraction, or source-loader for examples; manual strings are the smallest implementation.

## Evidence

- The `Example`/`CodeBlock` split was present in the first Orbit commit and unchanged through the PR.
- The Button, Box, and Spacing pages show consistent curation: layout wrappers removed from snippets, ellipsis for preview-only content, shorter snippets for icons.
- The Spacing page's `GAP_CODE` was flagged by an automated reviewer because the preview showed three children while the snippet showed two. This confirms synchronization matters, but is not an author rationale.
- Orbit's prop extraction uses a script, proving the authors add extraction when they need it. The absence of an example-extraction script supports the inference that manual strings were the deliberate simpler path.

## Risks

- No single source of truth: preview and string can drift.
- TypeScript checks the preview JSX but not the embedded string.
- Formatting and API changes must be applied twice.
- Curated omissions can be mistaken for accidental omissions.

## Recommended model for Inspector

Do not duplicate strings. Use ordinary TSX example files imported twice:

```tsx
import BasicButtonExample from "./basicButtonExample.tsx";
import basicButtonSource from "./basicButtonExample.tsx?raw";
```

Vite already provides both forms:

- Normal import: executable component through TypeScript, React Fast Refresh, StyleX, and the production build.
- `?raw` import: authored file text as a string for display and copying.

Suggested layout:

```text
apps/design-system/src/
  examples/
    button/
      basicButtonExample.tsx
  components/
    primitives/
      example.tsx
```

Definition:

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

Prefer explicit paired imports for a small catalog. Move to `import.meta.glob` only when registration becomes repetitive and chunk behavior is understood. Build a custom Vite query module only if the app needs centralized metadata or source-region extraction. Adopt MDX only for a prose-first authoring decision, not for source display. Reject runtime compilation for static examples.

## Implementation constraints

- Keep examples under `src/examples`, not `src/routes`, so TanStack Router does not generate routes from them.
- Use one default export per example file.
- Display the full raw file initially; it is deterministic and needs no parser.
- Let the repository formatter own TSX formatting; strip only an optional final newline at render time if needed.
- Expose `source: string` from the example definition; keep highlighting independent.
- Verify with:
  1. `pnpm --filter inspector.design-system typecheck`
  2. `pnpm --filter inspector.design-system build`
  3. Editing an example updates both preview and displayed source in dev.
  4. Production output includes the preview and raw string only in the intended route chunk.

## Escalation points

- Move to paired `import.meta.glob` maps if catalog registration becomes repetitive.
- Build a custom `?example` Vite module only if centralized metadata or source-region extraction is needed.
- Adopt MDX only for a broader prose-first authoring decision.
- Adopt runtime compilation only for an editable playground with explicit execution and isolation.

## Sources

- [Polar Orbit PR #12341](https://github.com/polarsource/polar/pull/12341)
- [Introducing branch commit](https://github.com/polarsource/polar/commit/c58aaff1e84f21d1a6090a3ca7f1b20b93724942)
- [Squash merge commit](https://github.com/polarsource/polar/commit/c1040c59d9fabb32eeac949b48c917ba6f509193)
- [Example.tsx](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/Example.tsx)
- [CodeBlock.tsx](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/CodeBlock.tsx)
- [Button page](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/button/page.tsx)
- [Box page](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/box/page.tsx)
- [Box examples](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/box/examples.tsx)
- [Spacing page](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/foundations/spacing/page.tsx)
- [Cubic mismatch comment](https://github.com/polarsource/polar/pull/12341#discussion_r3396694767)
- Vite static asset handling: https://vite.dev/guide/assets
- Vite features: https://vite.dev/guide/features
- Vite plugin API: https://vite.dev/guide/api-plugin
- MDX getting started: https://mdxjs.com/docs/getting-started/
- MDX using MDX: https://mdxjs.com/docs/using-mdx/
- Babel standalone: https://babeljs.io/docs/babel-standalone
- CSP script-src: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src
- React JSX: https://react.dev/learn/writing-markup-with-jsx
- TanStack Router file-based routing: https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing
