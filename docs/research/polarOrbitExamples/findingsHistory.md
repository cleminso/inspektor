# Polar Orbit example history findings

## Table of contents

- [Conclusion](#conclusion)
- [Evidence classification](#evidence-classification)
- [Implementation shape](#implementation-shape)
- [Git history and blame](#git-history-and-blame)
- [Pull request, reviews, comments, and issues](#pull-request-reviews-comments-and-issues)
- [Representative pages](#representative-pages)
- [Why the values are separate](#why-the-values-are-separate)
- [Risks of the pattern](#risks-of-the-pattern)
- [Research limits](#research-limits)
- [Sources](#sources)

## Conclusion

No Polar author explicitly explains why Orbit uses one JSX tree for the live preview and a separate string constant for displayed code. The introducing commit messages and pull request describe the broader goal only: create a destination for the Orbit design system.

The implementation supports this narrower inference:

1. `Example` accepts executable preview content as `children: ReactNode` and display text as `code?: string`.
2. The preview is rendered normally by React, while the string crosses into the client-side `CodeBlock`, where it is syntax-highlighted and copied to the clipboard.
3. The strings are often consumer-oriented excerpts rather than literal source. They omit documentation-only wrappers, demo decoration, sizing constraints, and sometimes implementation detail. The Box page makes this especially clear by rendering dedicated demo components while showing shortened snippets, including an ellipsis.
4. Orbit has no raw-source import, JSX serialization, AST extraction, or code generation path for examples. Separate strings are the smallest implementation that supports a live React preview plus curated, copyable code.

This is not evidence that divergence is always intentional. The Button and Spacing pages contain mismatches, and a Cubic automated review explicitly called one mismatch misleading. The pattern enables curation but also permits accidental drift.

## Evidence classification

### Explicit author rationale

None found.

- PR author Emil Widlund says only: "Implements a new destination for the Orbit Design System."
- The individual commit messages are broad implementation labels such as `foundation of orbit destinatino`, `init orbit destination`, and `finalize orbit destionation v0.1`.
- There are no author comments on `Example.tsx`, `button/page.tsx`, or the choice to pass code as strings.
- The merge commit has no commit comments.
- Repository issue searches found no separate issue discussing the example authoring model.

Sources: [PR #12341](https://github.com/polarsource/polar/pull/12341), [merge commit](https://github.com/polarsource/polar/commit/c1040c59d9fabb32eeac949b48c917ba6f509193), [merge commit comments API](https://api.github.com/repos/polarsource/polar/commits/c1040c59d9fabb32eeac949b48c917ba6f509193/comments).

### Explicit non-author evidence

Cubic's automated review identified a mismatch in `GAP_CODE`: the displayed snippet had two children while the preview rendered three. It said this was inconsistent and could mislead readers copying the example. This establishes that at least one reviewer expected semantic agreement between the two representations. It does not establish the author's reason for separating them.

The author did not reply to that thread. The mismatch remains in the merged source, so the record does not show whether it was accepted as deliberate, overlooked, or deferred.

Source: [Cubic review comment](https://github.com/polarsource/polar/pull/12341#discussion_r3396694767).

### Inference from code and history

The functional rationale below is inferred from the code:

- React needs a `ReactNode` to render the preview.
- Shiki and `navigator.clipboard.writeText` need a string.
- The displayed examples are edited for readers and are not always the preview's literal source.
- No infrastructure exists to derive one representation from the other.

This inference is strong because it follows the data flow and appears consistently across the docs application, but it is not a quoted design decision.

## Implementation shape

`Example.tsx` defines two independent inputs:

```tsx
code?: string
children: ReactNode
```

It renders `children` in the preview region and independently renders `<CodeBlock code={code} />`. There is no attempt to inspect, stringify, clone, or transform `children`.

Source: [`Example.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/Example.tsx#L6-L18), [render split](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/Example.tsx#L45-L56).

`CodeBlock.tsx` is a client component. It receives `code: string`, passes the string to `useHighlightedCode`, and passes the same string to `navigator.clipboard.writeText`. The string is therefore its direct display and copy payload.

Source: [`CodeBlock.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/CodeBlock.tsx#L1-L24).

`useHighlightedCode` initializes a client-side Shiki highlighter and calls `highlighter.codeToHtml(code, { lang, theme })`. It operates only on source text; it has no React-node or source-file extraction path.

Source: [`shiki.ts`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/lib/shiki.ts#L1-L50).

The component pages and `Example` do not declare `use client`, while `CodeBlock` and the highlighter do. This creates a clean server-to-client boundary: rendered React content remains normal page content, and the serializable source string is sent to the interactive highlighting and copy component. That boundary is evidence for the mechanics, not an explicit author rationale.

## Git history and blame

### Introducing branch commit

The files first appear together in branch commit [`c58aaff`](https://github.com/polarsource/polar/commit/c58aaff1e84f21d1a6090a3ca7f1b20b93724942), `foundation of orbit destinatino`:

- `clients/apps/orbit/src/components/docs/Example.tsx`
- `clients/apps/orbit/src/app/components/button/page.tsx`
- the rest of the initial Orbit documentation application

The first version already had the final API shape: `code?: string`, `children: ReactNode`, `{children}` for the preview, and `<CodeBlock code={code} />` for displayed source. The Button page already declared `variantsCode`, `sizesCode`, `iconCode`, and `statesCode` separately from its rendered JSX. The split was therefore foundational, not introduced by a later refactor or bug fix.

### Branch evolution

Only small presentation and unrelated props-link changes touched these target files after introduction:

- [`cf25523`](https://github.com/polarsource/polar/commit/cf2552326037ad564addbb3765f70e1baaf8ff78), `init orbit destination`, changed `Example` text and background tokens and added a props-table slug to Button.
- [`ac4021e`](https://github.com/polarsource/polar/commit/ac4021e475d62d1490a987877f200f194e7f8134), `finalize orbit destionation v0.1`, changed the preview background token.
- No branch commit changed the separate `code` and `children` contract or explained it.

PR #12341 contains ten branch commits. None has a message about source extraction, code strings, previews, or example synchronization. Source: [PR commits API](https://api.github.com/repos/polarsource/polar/pulls/12341/commits?per_page=100).

### Squash merge and blame

PR #12341 was squash-merged as [`c1040c59`](https://github.com/polarsource/polar/commit/c1040c59d9fabb32eeac949b48c917ba6f509193), `Orbit Destination (#12341)`. File history for both target paths contains only that merge commit. Blame assigns all lines in both files to Emil Widlund through that commit.

This means the public main-branch history cannot reveal a later rationale: the relevant design arrived atomically with the documentation application and has not been revised in either target file.

## Pull request, reviews, comments, and issues

### Pull request description

PR #12341 says only that it implements a new destination for Orbit. It provides no architecture notes and no explanation of example source handling.

Source: [PR #12341](https://github.com/polarsource/polar/pull/12341).

### Human review

The human review is an approval with no body and no inline comments about the example pattern.

Source: [human approval](https://github.com/polarsource/polar/pull/12341#pullrequestreview-4477607979).

### Automated review

Cubic left two inline comments. One is directly relevant: it called the `GAP_CODE` and preview child-count difference inconsistent and misleading for readers who copy the example. The other concerns invalid fallback markup inside `CodeBlock` and does not address why the source is separate.

Sources: [snippet-preview mismatch](https://github.com/polarsource/polar/pull/12341#discussion_r3396694767), [CodeBlock fallback markup](https://github.com/polarsource/polar/pull/12341#discussion_r3396694779).

The relevant review comment is evidence that synchronization matters, but it came from an automated reviewer. It should not be represented as Polar's stated rationale.

### General comments

The only general PR comment is an automated Vercel deployment comment. It contains no design rationale.

Source: [Vercel comment](https://github.com/polarsource/polar/pull/12341#issuecomment-4681500418).

### Issues and searches

Three GitHub issue/PR searches were used, below the requested limit of five:

- `Orbit "live preview"`
- `"GAP_CODE"`
- `"CodeBlock" "Example" Orbit`

They returned PR #12341 as the only relevant result. No standalone issue, follow-up PR, or discussion explaining the split was found. The repository has GitHub Discussions disabled according to its repository metadata in the PR API response.

Search sources: [live preview search](https://api.github.com/search/issues?q=repo%3Apolarsource%2Fpolar%20Orbit%20%22live%20preview%22&per_page=100), [GAP_CODE search](https://api.github.com/search/issues?q=repo%3Apolarsource%2Fpolar%20%22GAP_CODE%22&per_page=100), [CodeBlock and Example search](https://api.github.com/search/issues?q=repo%3Apolarsource%2Fpolar%20%22CodeBlock%22%20%22Example%22%20Orbit&per_page=100).

## Representative pages

### Button

Button keeps four top-level source strings and four corresponding preview trees in the same file.

Source: [`button/page.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/button/page.tsx).

The strings are not literal copies of the JSX children:

- Every preview adds a `Box` solely to control documentation layout; every displayed snippet omits that wrapper. This is strong evidence of intentional reader-facing curation.
- `sizesCode` compresses the icon button to one line while the live JSX formats it across lines. This is harmless editorial formatting.
- `iconCode` shows the first two buttons but the live preview also renders a destructive Delete button. There is no comment showing whether this omission is deliberate or drift.
- `statesCode` lists three buttons as siblings, while the preview uses nested `Box` layout wrappers. The visible component states agree, while docs-only layout is omitted.

The Button page therefore demonstrates the practical benefit and risk of separate values: examples can omit preview scaffolding, but they are manually synchronized.

### Box

Box makes the curation intent clearer. Its page imports `StackDemo`, `RowDemo`, `CardDemo`, `PolymorphismDemo`, and `InteractiveDemo` from `examples.tsx`, then provides separately authored snippets.

Sources: [`box/page.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/box/page.tsx#L9-L65), [`box/examples.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/box/examples.tsx).

Examples of deliberate shortening:

- `CardDemo` has `maxWidth={320}` for preview presentation; `cardCode` omits it.
- `PolymorphismDemo` has an outer layout container and more text/list items; `polymorphismCode` omits the outer demo wrapper and reduces the content.
- `interactiveCode` replaces content with an ellipsis and omits preview-only direction, gap, and width constraints.
- The private `Tile` component supplies visual swatch styling, while stack and row snippets focus on the Box layout API.

These differences are systematic: live demos need enough structure to look legible in the docs canvas, while displayed code emphasizes the API being taught.

### Spacing

Spacing shows the failure mode. `GAP_CODE` displays two plain child boxes. The preview renders three mapped children with padding, radius, background, borders, and nested Text.

Source: [`spacing/page.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/foundations/spacing/page.tsx#L19-L22), [live preview](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/foundations/spacing/page.tsx#L76-L101).

Some extra preview styling is reasonably inferred to be visual scaffolding. The two-versus-three child difference was explicitly identified by Cubic as misleading, however, and cannot be confidently classified as intentional curation.

## Why the values are separate

The best-supported answer, clearly labeled as inference, is a combination of representation and editorial needs.

### Different runtime representations

The outer page needs executable React elements so imports, props, state, styles, and event behavior work normally. The inner code viewer needs source text so Shiki can tokenize it and the Clipboard API can copy it. React elements do not retain a reliable, author-formatted JSX source representation at runtime.

Orbit resolves that mismatch explicitly rather than adding a source-loader or compiler layer.

### Curated consumer examples

The code strings can show the minimal usage a consumer should copy. The live preview can retain wrappers, constraints, helper components, and richer content needed to demonstrate the result. Box is the strongest repository evidence for this purpose.

### Minimal infrastructure

The Orbit app includes a generation script for component prop metadata, proving the authors were willing to add extraction when they needed source-derived documentation. There is no equivalent script for examples and no `?raw`, raw-loader, MDX, AST serializer, or source registry for JSX. That contrast supports the inference that manual strings were the deliberately simpler implementation for examples.

Source: [`extract-props.mjs`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/scripts/extract-props.mjs), [`package.json`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/package.json).

### Server/client separation

Keeping the page and preview as ordinary server-rendered component content while sending a string into a client `CodeBlock` is compatible with the app's Next.js component boundaries. This is an implementation advantage visible in the code, but no author says it drove the decision.

## Risks of the pattern

- There is no single source of truth for semantics.
- TypeScript checks the live JSX but not JSX embedded in strings.
- Formatting and API changes must be applied twice.
- Curated omissions can be mistaken for accidental omissions, and accidental omissions can look intentional.
- Copyable examples can become invalid or disagree with the preview without failing a build.
- The PR's Spacing review comment demonstrates that this risk occurred in the introducing change.

The history therefore supports neither extreme claim. It does not support "the values are separate because the author explicitly wanted arbitrary divergence," and it does not support "the duplication was accidental." The split is foundational and mechanically useful; its editorial purpose is strongly inferable; its synchronization policy is undocumented.

## Research limits

- GitHub CLI was unavailable, so repository history came from a full local Git clone and GitHub metadata came from public API and web endpoints.
- The branch and squash histories were both inspected. The squash merge collapses main-branch blame to one commit, while the fetched PR head exposes the ten branch commits.
- Public PR reviews, inline comments, issue comments, commit comments, and targeted issue/PR searches were inspected.
- No private planning document, unpublished review thread, Vercel feedback item, or author interview was available.
- Absence of a public rationale is not proof that no rationale existed outside the repository.

## Sources

- [PR #12341: Orbit Destination](https://github.com/polarsource/polar/pull/12341)
- [PR metadata API](https://api.github.com/repos/polarsource/polar/pulls/12341)
- [PR commits API](https://api.github.com/repos/polarsource/polar/pulls/12341/commits?per_page=100)
- [PR reviews API](https://api.github.com/repos/polarsource/polar/pulls/12341/reviews?per_page=100)
- [PR inline comments API](https://api.github.com/repos/polarsource/polar/pulls/12341/comments?per_page=100)
- [PR issue comments API](https://api.github.com/repos/polarsource/polar/issues/12341/comments?per_page=100)
- [Introducing branch commit](https://github.com/polarsource/polar/commit/c58aaff1e84f21d1a6090a3ca7f1b20b93724942)
- [Squash merge commit](https://github.com/polarsource/polar/commit/c1040c59d9fabb32eeac949b48c917ba6f509193)
- [`Example.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/Example.tsx)
- [`CodeBlock.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/components/docs/CodeBlock.tsx)
- [`button/page.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/button/page.tsx)
- [`box/page.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/box/page.tsx)
- [`box/examples.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/components/box/examples.tsx)
- [`spacing/page.tsx`](https://github.com/polarsource/polar/blob/c1040c59d9fabb32eeac949b48c917ba6f509193/clients/apps/orbit/src/app/foundations/spacing/page.tsx)
- [Cubic mismatch comment](https://github.com/polarsource/polar/pull/12341#discussion_r3396694767)
