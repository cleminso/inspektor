# Domain

This view defines valid inspection state and outcomes. It answers: what must remain true when users inspect or change Jazz data?

## Contents

Topic contracts own decisions and invariants.

- [[inspectionContext|Inspection context]] — Connection, schema, branch label, and permissions.
- [[rowChanges|Row changes]] — Local drafts and accepted mutations.

## Rules

Describe the decision before its implementation.

- Use the [glossary](../../GLOSSARY.md) for meanings.
- State relevant facts, valid transitions, outcomes, and refusals.
- Keep API syntax and resource ownership in their owning views.

## Related views

Link rather than repeat rules.

See [[journeys|Journeys]] for user goals, [[architecture|Architecture]] for execution owners, and [[interfaces|Interfaces]] for caller contracts.
