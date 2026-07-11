# Polar Orbit: LLM-Safe Design System Findings

## Table of contents

- [Source and scope](#source-and-scope)
- [Direct claims](#direct-claims)
- [Inferences](#inferences)
- [Limits and qualifications](#limits-and-qualifications)

## Source and scope

Primary source: [Building an LLM safe design system](https://polar.sh/blog/orbit-llm-safe-design-system), Polar.

This summary separates statements made directly by Polar from conclusions inferred from those statements.

## Direct claims

### LLM-safe APIs

- The goal is to restrict what generated code can express: “make it hard to express an off-brand decision in code in the first place. Ideally close to impossible.” Values that are not accepted design decisions “should not pass our CI.”
- Orbit exposes a typed `Box` primitive whose styling props accept tokens rather than unrestricted CSS values. Polar describes the result as “a short menu we wrote”: autocomplete presents valid tokens, and invalid names become type errors.
- A typo should fail structurally rather than survive as visual drift: “A typo is a type error, not a visual regression.”

### Closed styling system

- Typed props are insufficient while an unrestricted path remains available: “Constraining the props on Box does nothing if the unconstrained thing is still sitting right next to it.”
- Polar therefore proposes removing raw layout elements as authoring surfaces and using polymorphic `Box as="nav"`, `Box as="ul"`, and `Box as="li"` instead. The intent is to preserve semantic DOM output and typed DOM props while removing unrestricted styling strings.
- The `as` prop is deliberately closed: “as is a closed set of allowed elements; a bare [element] is an open door.”

### Semantic and value tokens

- Polar distinguishes values from decisions: “A design system is not a pile of values. It's a set of decisions.” `p-4` and `--color-gray-100` state values but not intended roles.
- A renamed raw value is still insufficient: “A CSS variable doesn't fix this. `--color-gray-100: #f3f4f6` is still a value with a nicer name.”
- Orbit names color tokens by intent, such as `background-card`, so theme-specific values remain implementation details. Polar says two uses of `padding="l"` declare “the same decision,” rather than merely sharing a pixel value.
- The article’s spacing examples (`xs`, `s`, `m`, `l`) are scale roles, while color examples (`background-card`, `text-secondary`) encode semantic purpose. This is the article’s explicit token model, even though spacing names are less context-specific than color names.

### `className` and arbitrary-value escape hatches

- Polar identifies string APIs as an unlimited error surface: “A string surface gives an LLM infinite room to be slightly wrong.” Examples include nearby but inconsistent utility choices, omitted dark variants, and arbitrary values such as `text-[#3b82f6]` that bypass the palette.
- “The moment an LLM can drop to a raw className or an inline style, every guarantee you built around it gets weaker.” Polar notes that LLM training data strongly favors these escape hatches.
- Missing values should normally trigger design-system work: “we'd rather that be a signal to add a token than to bypass the system.” Allowed exceptions are audited through `eslint-disable` usage; growth in those exceptions is treated as a design-system bug.

### Composition and semantics

- Composition centers on a general typed primitive plus specialized components such as `Text`; examples nest these components rather than passing unrestricted styles into raw HTML.
- Polymorphism is the semantic escape from a visually closed primitive API: `Box` can render approved semantic elements while forwarding their correctly typed DOM props.
- Polar’s stated trade is: “What you lose is the open string surface, not the semantics.”

### Deterministic enforcement

- Documentation and prompting are explicitly rejected as guarantees: “Anything you put in a doc is a probability, not a guarantee.”
- Rules that matter are encoded as ESLint checks run in CI, including `polar/no-raw-html-layout`. Polar calls this “one deterministic contract.”
- Enforcement changes responsibility: generated code may attempt anything, but only approved forms pass CI. If an off-system result passes, Polar treats that as a missing rule rather than author failure.
- The strongest formulation is: “Making the wrong thing fail to compile is, so far, the only instruction we've found that survives an LLM’s fresh context window.”

## Inferences

- **Inference:** An LLM-safe component API should optimize for a small, discoverable set of valid constructions, not merely provide good documentation for a broad API. This follows from Polar’s typed-token and closed-element arguments; the article does not define a general API design standard.
- **Inference:** Escape hatches should be measurable and centrally reviewable. Polar explicitly audits `eslint-disable` lines, but does not prescribe a universal threshold or approval process.
- **Inference:** Type safety and linting cover complementary boundaries: types constrain token values and element props, while lint rules prevent bypass through raw elements. Polar demonstrates both but does not claim they eliminate every possible off-system expression.
- **Inference:** Semantic tokens improve future refactoring because intent remains queryable at call sites. Polar explains that value-based usage forces developers to grep colors; the broader maintainability conclusion follows from that example.
- **Inference:** Theme behavior belongs behind tokens when possible. Polar directly uses `light-dark()` to make separate dark-mode authoring unexpressible, but does not claim that all responsive, state, or theme variation can be hidden this way.

## Limits and qualifications

- Polar presents Orbit as an early experiment: “take this as a direction rather than a verdict.”
- Closed token sets are currently too small for some real interfaces, and Polar is watching for the point where constraint costs exceed its benefits.
- Polar has not finalized where legitimate escape hatches end. The article says that boundary will continue to move.
- StyleX is described as the mechanism, not the core principle. The guidance is therefore not a claim that StyleX itself makes a system LLM-safe.
- The article is not an argument that Tailwind is generally unsuitable. Polar says Tailwind’s openness is valuable for human-authored markup and problematic specifically when an LLM becomes the primary author.
