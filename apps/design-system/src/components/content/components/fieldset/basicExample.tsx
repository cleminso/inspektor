import { Field, Fieldset, Input } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Fieldset.Root>
      <Fieldset.Legend>Billing details</Fieldset.Legend>
      <Field.Root name="company">
        <Field.Label>Company</Field.Label>
        <Input
          placeholder="Enter company name"
          fullWidth
        />
      </Field.Root>
      <Field.Root name="taxId">
        <Field.Label>Tax ID</Field.Label>
        <Input
          placeholder="Enter tax ID"
          fullWidth
        />
      </Field.Root>
    </Fieldset.Root>
  )
}
