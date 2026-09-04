# Base UI component anatomy research plan

## Table of contents

- [Question](#question)
- [Subtopics](#subtopics)
- [Expected synthesis](#expected-synthesis)

## Question

What mental model explains the anatomy of a Base UI component, including its compound parts, props, state, refs, rendering model, TypeScript declarations, accessibility behavior, and the responsibilities of a design-system wrapper?

## Subtopics

1. **Public component anatomy:** identify the recurring roles of Root, Trigger, Portal, Positioner, Popup, Item, Indicator, and other parts, including why compound components expose these boundaries.
2. **Behavioral contracts:** explain controlled and uncontrolled state, event callbacks, DOM attributes, accessibility semantics, element ownership, and native-element contracts such as `nativeButton`.
3. **React and TypeScript structure:** map `Part.Props`, `Part.State`, refs, `render`, `useRender`, generic value types, prop omission, and wrapper declarations to the needs they answer.
4. **Inspector wrapper application:** compare the Base UI boundary with representative wrappers in `@inspektor/ds` and identify what must be preserved, constrained, added, or kept private.

## Expected synthesis

The final document will proceed from consumer composition to DOM execution. It will include role maps, data-flow diagrams, annotated TypeScript examples, design questions, failure modes, and a repeatable checklist for reading or authoring a component wrapper.
