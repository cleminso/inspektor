# Base UI API-reference architecture comparison

## Table of contents

- [Question](#question)
- [Subtopics](#subtopics)
- [Synthesis](#synthesis)

## Question

How do Base UI v1.6.0, Polar Orbit, and the local design-system scaffold derive and consume prop metadata, and which model best keeps `packages/design-system` authoritative without adding disproportionate infrastructure?

## Subtopics

1. Trace Base UI v1.6.0 from component source through extraction, generated artifacts, and API-reference rendering.
2. Compare Polar Orbit's extraction and the local scaffold's package/app boundary, identifiers, and current duplication.
3. Evaluate committed JSON, generated TypeScript modules, and package runtime exports against authority, validation, coupling, and maintenance cost.

## Synthesis

Separate upstream facts from local recommendations, then identify the smallest complete metadata path and the role of `componentId` at each boundary.
