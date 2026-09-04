# Component audit

## Table of contents

- [Purpose](#purpose)
- [Audit sequence](#audit-sequence)
- [Component record](#component-record)
- [Part record](#part-record)
- [Classification](#classification)
- [Audit outcome](#audit-outcome)

## Purpose

Use this audit before creating or changing a Base UI wrapper. Trace the public Inspektor call through prop normalization, Base UI composition, StyleX state selection, and rendered DOM. Do not treat every difference as a defect; classify intentional Inspektor policy separately from accidental divergence.

## Audit sequence

1. Identify the installed Base UI version.
2. Read the handbook pages relevant to the component.
3. Read the matching component API and tagged source.
4. Record required anatomy and default elements.
5. Classify every wrapped part.
6. Compare the Base UI and Inspektor prop surfaces.
7. Record every omission and transformation.
8. Trace refs, events, ARIA, state attributes, and CSS variables to the DOM.
9. Compare tests and documentation with the resulting contract.
10. Classify findings and required proof.

## Component record

Copy this section into the relevant component checklist or audit document:

```/dev/null/componentAudit.md#L1-31
# Component audit

## Sources

- Installed Base UI version:
- Component API:
- Handbook pages:
- Tagged source:
- Adjacent Inspektor components:

## Required anatomy

| Part | Required relationship | Default element | Inspektor wrapper |
| --- | --- | --- | --- |

## Public contract summary

| Capability | Base UI | Inspektor | Classification | Rationale |
| --- | --- | --- | --- | --- |

## Findings

### Preserved contracts

### Intentional Inspektor constraints

### Inspektor extensions

### Accidental divergences

### Decisions required
```

## Part record

Complete this record for every wrapped part:

```/dev/null/partAudit.md#L1-48
## Part: Trigger

- Role: behavioral endpoint
- Default element:
- Public ref target:
- Public `render`: yes/no
- Valid render targets:

### Props

| Prop | Base default | Inspektor default | Action | Rationale |
| --- | --- | --- | --- | --- |

Actions: inherit, omit, redeclare, transform, consume, inject.

### Events

| Event | Signature preserved | Details preserved | Merge behavior |
| --- | --- | --- | --- |

### State capabilities

| State | Data attribute | Styled | Local rule | Classification |
| --- | --- | --- | --- | --- |

### CSS variables

| Variable | Used | Mapping or rationale |
| --- | --- | --- |

### Accessibility and DOM

- Generated role:
- Accessible-name source:
- Generated ARIA relationships:
- Consumer ARIA and DOM props preserved:
- Keyboard and focus behavior:
- Disabled and read-only behavior:

### Composition

- Prop merge order:
- Ref flow:
- Default semantic element:
- Native-element configuration:

### Proof

- Behavioral test:
- Type or API contract test:
- DOM and accessibility assertion:
- Documentation example:
```

## Classification

- **Preserved Base UI contract:** behavior and public capability remain equivalent.
- **Intentional Inspektor constraint:** a capability is fixed, omitted, or narrowed for a recorded system reason.
- **Inspektor extension:** package-owned semantics are added without replacing primitive behavior.
- **Accidental divergence:** behavior, typing, semantics, refs, events, attributes, or variables differ without justification.
- **Decision required:** evidence is complete but product or design policy is unresolved.

## Audit outcome

An audit is complete when every part, omission, transformation, ref target, render boundary, state capability, and CSS variable has a classification. Do not implement unresolved decisions unless the user explicitly selects an outcome.
