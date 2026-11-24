# Inspektor documentation

These documents describe Inspektor through linked views of one inspection model. This index owns navigation and writing guidance. Topic contracts own detailed rules.

## Table of contents

Start with the view that answers your question.

- [Views](#views)
- [Writing rules](#writing-rules)
- [Planning notes](#planning-notes)

## Views

Read the [glossary](../GLOSSARY.md) for terms, then follow the relevant view.

- [[domain|Domain]] — Valid inspection state, decisions, and outcomes.
- [[journeys|Journeys]] — User goals, sequences, failures, and continuation.
- [[architecture|Architecture]] — Responsibility, authority, resource ownership, and reasons.
- [[interfaces|Interfaces]] — Caller inputs, outputs, obligations, and failures.

For a change, trace its domain rule, user journey, execution owner, and interface. These views do not prescribe source folders.

## Writing rules

Give each rule one owning topic. Other views link to it.

- Follow the owning view's index. Use glossary terms and terse Simplified Technical English.
- Separate accepted contracts, proposals, implementation, and verified behavior. Ask about conflicts before changing behavior.
- Keep reasons and constraints that source alone cannot explain. Remove source inventories, implementation walkthroughs, and duplicate API guidance.
- Start each heading with a descriptive paragraph of at most 250 characters.
- Use wiki links between contracts. Preserve relevant source `@lat:` references when moving topics.
- Keep indexes limited to navigation and authoring guidance. Keep work records outside the four contract views.
- Run `lat check` after edits. It checks structure and references, not runtime correctness.

## Planning notes

Proposals and open work are not proof of implemented behavior.

- [[ideas|Ideas]] — Proposed or deferred changes.
- [Work ledgers](../todo.md/index.md) — Durable open work, completion conditions, and validation gaps.
