# Design system

The design system combines Base UI behavior, Inspektor visual decisions, and StyleX output. [[boundaries#Owners|Workspace boundaries]] assign application and package responsibilities.

## Contents

Read the build boundary before changing package output. Read the component contract before changing a wrapper.

- [Package output](#package-output)
- [Browser presentation](#browser-presentation)
- [Semantic decisions](#semantic-decisions)
- [Executable documentation](#executable-documentation)

## Package output

Workspace consumers select public source exports with `inspektor-source`. Distribution consumers load ESM and declarations. These are separate contracts.

The unbundled distribution preserves StyleX module identities, dynamic imports, and module-level tree shaking. The consumer compiles StyleX and extracts final CSS because it owns the complete application graph.

The full package build emits runtime modules, then uses checked TypeScript declaration emission. Runtime-only compilation does not prove semantic type correctness. TSDown declaration generation is disabled for this reason.

See [[importBoundaryPlaybook#Consumer graph|Import boundaries]] before interpreting bundle output.

## Browser presentation

The optional `@inspektor/ds/baseline.css` normalizes browser defaults. StyleX generates authored styles; Base UI supplies behavior. Neither replaces browser normalization.

Applications load fonts, the baseline, application globals, and generated component styles in that order. Components remain complete without the baseline. Each component styles its own elements; application globals own document policy and theme activation.

## Semantic decisions

Public components expose constrained semantic choices, not arbitrary CSS. Add a token, variant, or composition when the existing vocabulary cannot express a valid design.

Use Base UI, StyleX, and typed tokens, not Tailwind. Applications and public component APIs cannot bypass the system through `className`, inline styles, raw HTML layout, or broad styling overrides. Necessary exceptions require narrow, explicit lint suppression.

Disabled presentation suppresses hover and pressed treatment. Invalid focus remains distinct from neutral focus. Persistent selection can share a hover color when a separate indicator carries persistence.

Color, spatial, and layer roles express intent. Keep numeric values in tokens rather than copying them into component contracts. [[components#Wrapper contract|Component wrappers]] own state-to-style integration.

## Executable documentation

Component pages teach supported usage through authored scenarios, not a generic prop inspector.

MDX owns prose and scenario order. Typechecked TSX owns executable examples, state, and styles. Static route modules import MDX; MDX does not generate routes.

Each scenario supplies both its rendered example and its displayed `?raw` source from one TSX file. Registry contracts require stable routes, authored pages, and executable scenarios. Keep component correctness in package tests; [[boundaries#Validation|workspace validation]] owns test boundaries.
