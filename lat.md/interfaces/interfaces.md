# Interfaces

This view defines caller obligations and observable results. It answers: what must each side supply, receive, and handle?

## Contents

Topic contracts own integration requirements.

- [[jazzAccess|Jazz access]] — Runtime inputs, query results, and mutation failures.
- [[components|Components]] — Public design-system consumption.

## Rules

Describe the contract, not the internal implementation.

- State inputs, outputs, failure meaning, and cleanup obligations.
- Claim cancellation, retry, or compatibility guarantees only where supported.
- Label proposed signatures. Examples do not establish public exports.
- Link decision and execution owners.

## Related views

Connect interfaces to the behavior they expose.

See [[domain|Domain]] for decisions, [[journeys|Journeys]] for user goals, and [[architecture|Architecture]] for execution guarantees.
