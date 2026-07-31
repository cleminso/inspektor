# Creating components

## Table of contents

- [Context](#context)
- [Mental model](#mental-model)
- [Base UI state](#base-ui-state)
- [Inspector styling decisions](#inspector-styling-decisions)
- [StyleX output](#stylex-output)
- [Shared state-style adapter](#shared-state-style-adapter)
- [Strict package ownership](#strict-package-ownership)
- [Field composition decisions](#field-composition-decisions)

## Context

We build the Inspector design system from Base UI behavior, Inspector tokens, and StyleX styles.

## Mental model

Three systems cooperate:

1. Base UI calculates component state.
2. Inspector decides which states have visual meaning.
3. StyleX turns selected styles into DOM props.

## Base UI state

When an Input is inside `Field.Root`, Base UI coordinates disabled, valid, dirty, touched, filled, and focused state through context.

Base UI exposes that state as:

- a JavaScript object passed to `className` and `style` callbacks;
- DOM attributes such as `data-invalid` and `data-focused`.

Prefer the typed state callbacks for conditional StyleX classes. Keep data attributes for inspection, testing, CSS interoperability, or cases without a state callback.

## Inspector styling decisions

Available state does not require visible styling. Inspector currently gives disabled, focused, and invalid Input states visual meaning. Dirty, touched, filled, and valid remain behavioral unless a product design needs them.

## StyleX output

`stylex.props(...)` returns `className` and `style`. Static declarations become atomic classes. Dynamic StyleX values use inline CSS custom properties and require `style`.

> Base UI state goes in, Inspector styles are selected, and StyleX DOM props come out.

## Shared state-style adapter

Polar's `resolveProperties.ts` resolves constrained layout props to static Tailwind classes; it is not a Base UI state-to-StyleX adapter. Inspector uses `createStateStyleProps` to define the state mapping once and provide both callbacks expected by Base UI.

The adapter removes duplicated selection logic. It does not cache `stylex.props(...)`, because callback state identity and prop-dependent styles do not justify that complexity.

## Field composition decisions

The connection form benefits from `Form`, `Field`, `Input`, `Field.Description`, and `Field.Error`. Repeated text controls may justify the planned `TextField`. Its vertical list and two-column row can use constrained layout primitives; they do not require `Field.Item` or `Field.Validity`.

The row editor renders different controls from schema metadata and attaches a nullable toggle to some fields. This may justify a reusable field-list layout after migration evidence accumulates, but not `Field.Item`: Base UI Item is intended for individually labeled checkbox or radio items in one field. Existing external parsing errors fit `Field.Root invalid` with `Field.Error match={true}`. `Field.Validity` is only needed for custom live validity UI such as requirement checklists.

Do not copy shadcn's full Field layout surface by default. Add `FieldGroup`, orientation, content, Item, or Validity only when repeated Inspector compositions establish a constrained API.
