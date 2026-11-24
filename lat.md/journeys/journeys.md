# Journeys

This view connects user goals to inspection outcomes. It answers: how does a user finish an operation, handle failure, or continue?

## Contents

Topic contracts own end-to-end flows.

- [[openConnection|Open a connection]] — Enter a resolved workspace.
- [[exploreTables|Explore tables]] — Select schema data, query rows, and inspect values.
- [[changeRow|Change a row]] — Prepare, submit, or discard a change.

## Rules

Describe the goal and completion condition before the sequence.

- Name the actor, trigger, prerequisites, and outcome.
- Include failures and supported continuation.
- Link decision and interface owners. Keep code walkthroughs in source.

## Related views

Use other views to explain why a step is valid.

See [[domain|Domain]] for invariants, [[architecture|Architecture]] for responsibility crossings, and [[interfaces|Interfaces]] for inputs and results.
