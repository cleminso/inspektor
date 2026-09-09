import { Box, Field, Input } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { fieldItem } from '@/lib/registry'

export interface FieldPlaygroundState {
  disabled: boolean
  invalid: boolean
  description: boolean
  error: boolean
  [key: string]: boolean | string
}

const initialState: FieldPlaygroundState = {
  disabled: false,
  invalid: false,
  description: true,
  error: false,
}

const controls = [
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'invalid', label: 'Invalid' },
  { kind: 'boolean', key: 'description', label: 'Description' },
  { kind: 'boolean', key: 'error', label: 'Error' },
] as const satisfies readonly PlaygroundControl<FieldPlaygroundState>[]

export function serializeFieldPlayground(state: FieldPlaygroundState): string {
  const rootProps = ['name="email"']
  if (state.disabled === true) rootProps.push('disabled')
  if (state.invalid === true || state.error === true) rootProps.push('invalid')
  const description =
    state.description === true
      ? '\n      <Field.Description>Used for account notifications.</Field.Description>'
      : ''
  const error =
    state.error === true
      ? '\n      <Field.Error match>Enter a valid email address.</Field.Error>'
      : ''

  return createPlaygroundSource({
    imports: { Field: true, Input: true },
    example: `(
    <Field.Root ${rootProps.join(' ')}>
      <Field.Label>Email</Field.Label>
      <Input type="email" placeholder="name@example.com" fullWidth />${description}${error}
    </Field.Root>
  )`,
  })
}

export function FieldPlayground(): ReactElement {
  const [state, setState] = useState<FieldPlaygroundState>(initialState)
  const preview = (
    <Box width="popup-width-m">
      <Field.Root
        name="email"
        disabled={state.disabled}
        invalid={state.invalid === true || state.error === true}
      >
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          placeholder="name@example.com"
          fullWidth
        />
        {state.description === true ? (
          <Field.Description>Used for account notifications.</Field.Description>
        ) : null}
        {state.error === true ? (
          <Field.Error match>Enter a valid email address.</Field.Error>
        ) : null}
      </Field.Root>
    </Box>
  )

  return (
    <ComponentDocsPage
      item={fieldItem}
      preview={preview}
      sourceCode={serializeFieldPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
          onReset={() => setState(initialState)}
        />
      }
    />
  )
}
