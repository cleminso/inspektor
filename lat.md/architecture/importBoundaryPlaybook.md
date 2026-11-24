# Import boundaries

Optional dependencies stay outside the first usable render. Deferred behavior remains inside its React owner and preserves the public interaction contract.

## Contents

Use this contract for heavy dependencies and dynamic imports.

- [Consumer graph](#consumer-graph)
- [Deferred ownership](#deferred-ownership)
- [Loading and transition](#loading-and-transition)
- [Evidence](#evidence)

## Consumer graph

Inspect the export that the consumer resolves before measuring an import change. A workspace source consumer does not execute package bundler output.

Preserve the module graph described in [[designSystem#Package output|package output]]. A public barrel can retain unrelated modules. Use a focused public entry when that boundary materially reduces traversal or retained code.

Studio limits the StyleX transform hook to design-system source. Expand that filter before adding another StyleX source owner. The narrow plugin-timing suppression does not disable other build checks.

Measure the entry's complete static module-preload closure. Moving the same modules between preloaded chunks does not reduce loading, parsing, or evaluation.

## Deferred ownership

The static component renders usable content. One deferred module contains all runtime imports for the optional behavior, including hooks, helpers, sensors, and overlays.

A dependency-free context can expose narrow component slots between static parts and deferred behavior. Behavioral hooks attach refs to their owning elements under their provider. Keep the deferred implementation out of static public re-exports.

Data Grid reordering uses this boundary. The rejected sibling-runtime approach discovered DOM elements and matched controlled values by position. Tab movement became unstable because DOM order was not semantic identity. Preserve declarative ownership instead.

## Loading and transition

Use one loading policy and one shared in-flight promise per deferred module. Clear a rejected promise so another mount can retry. Report component-specific failures and prevent updates after unmount.

Keep configuration, readiness, and enabled behavior distinct. Static content remains operable while loading; reorder affordances appear only when behavior is ready. Reject ambiguous controlled identities explicitly.

Adding a provider can remount descendants. Capture semantic focus identity and restore focus after the transition. Define what happens to selection, scroll, uncontrolled state, and refs. Do not claim DOM identity survives a wrapper change.

Keep loaders local unless several features share the same lifecycle and failure contract. Post-mount loading does not also need redundant pointer and focus triggers.

## Evidence

Boundary tests verify the usable static state, deferred activation, owning refs, controlled output, invalid identities, and semantic focus restoration.

Inspect consumer production output to confirm that heavy dependencies leave the initial closure. A separate package chunk alone does not prove this. Add permanent bundle inspection only for an adopted automated budget.

Record the reason, ownership bridge, and required transition behavior beside the loader. Preserve rejected approaches when their failure is not apparent from source.
