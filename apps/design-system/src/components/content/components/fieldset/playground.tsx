import { Box, Field, Fieldset, Input } from '@inspector/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { fieldsetItem } from '@/lib/registry'

export interface FieldsetPlaygroundState {
  disabled: boolean
  [key: string]: boolean | string
}

const initialState: FieldsetPlaygroundState = { disabled: false }

const controls = [
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
] as const satisfies readonly PlaygroundControl<FieldsetPlaygroundState>[]

export function serializeFieldsetPlayground(state: FieldsetPlaygroundState): string {
  const root = state.disabled === true ? '<Fieldset.Root disabled>' : '<Fieldset.Root>'

  return createPlaygroundSource({
    imports: { Field: true, Fieldset: true, Input: true },
    example: `(
    ${root}
      <Fieldset.Legend>Billing details</Fieldset.Legend>
      <Field.Root name="company">
        <Field.Label>Company</Field.Label>
        <Input placeholder="Enter company name" fullWidth />
      </Field.Root>
      <Field.Root name="taxId">
        <Field.Label>Tax ID</Field.Label>
        <Input placeholder="Enter tax ID" fullWidth />
      </Field.Root>
    </Fieldset.Root>
  )`,
  })
}

export function FieldsetPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<FieldsetPlaygroundState>(initialState)
  const preview = (
    <Box width="popup-width-m">
      <Fieldset.Root disabled={state.disabled}>
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
    </Box>
  )

  return (
    <ComponentDocsPage
      title={fieldsetItem.title}
      description={fieldsetItem.description}
      source={fieldsetItem.source}
      preview={preview}
      sourceCode={serializeFieldsetPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
          onReset={() => setState(initialState)}
        />
      }
    >
      {children}
    </ComponentDocsPage>
  )
}
