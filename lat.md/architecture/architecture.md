# Architecture

This view assigns responsibility and explains execution guarantees. It answers: who decides, verifies, executes, and releases resources, and why?

## Contents

Topic contracts own boundaries and their reasons.

- [[boundaries|Workspace boundaries]] — Package ownership and validation.
- [[routing|Routing]] — Stable provider and outlet ancestry.
- [[runtimeConnectionStartup|Runtime startup]] — Connection phases and client lifetime.
- [[tableQueries|Table queries]] — Query identity, subscriptions, and row windows.
- [[designSystem|Design system]] — Presentation and styling boundaries.
- [[importBoundaryPlaybook|Import boundaries]] — Optional dependency loading.
- [[website|Website]] — Request dispatch and shared-origin security.

## Rules

Assign each guarantee to the owner that can enforce it.

- Identify authoritative state, resource lifetime, and failure boundaries.
- Separate local state changes from accepted server results.
- Explain non-obvious choices and consequences.
- Link domain and interface owners instead of redefining them.

## Related views

Architecture explains how the other views' contracts are enforced.

See [[domain|Domain]] for valid outcomes, [[journeys|Journeys]] for user flows, and [[interfaces|Interfaces]] for caller obligations.
