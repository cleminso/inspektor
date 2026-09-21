# Row Editor

## Table of contents

- [Implemented foundation](#implemented-foundation)
- [Open product work](#open-product-work)
- [Work outside the foundation scope](#work-outside-the-foundation-scope)
- [Settled interaction decisions](#settled-interaction-decisions)
- [Open design decisions](#open-design-decisions)
- [Validation checklist](#validation-checklist)

## Implemented foundation

[21/09/26]

- [x] Move focus into the value control when a nullable field leaves NULL mode.
- [x] Validate a field after focus leaves its complete interaction context.
- [x] Present active Details validation below its field instead of in the mutation widget.
- [x] Retain global invalid-draft feedback when no complete-row editor owns the feedback.

## Open product work

[21/09/26]

- None.

## Work outside the foundation scope

[21/09/26]

- Parsing rules and mutation-ledger validity remain unchanged.
- Field-editor widget submission behavior remains unchanged.

## Settled interaction decisions

[21/09/26]

- Switching from NULL to Value does not expose validation feedback before the user leaves the field context.
- Focus movement between controls belonging to one field does not validate that field.
- Picker fields keep their picker-owned focus behavior when they leave NULL mode.
- Invalid drafts continue to block Apply even while their feedback is owned by the active row's Details representation.
- The mutation widget retains fallback feedback for invalid insertions, other rows, JSON, and Provenance.

## Open design decisions

[21/09/26]

- None.

## Validation checklist

[21/09/26]

- [x] Cover nullable primitive and structured focus transfer.
- [x] Cover contextual validation and ARIA error association.
- [x] Cover mutation-widget feedback ownership without weakening Apply blocking.
- [x] Verify focus transfer and inline feedback in the assembled application.
