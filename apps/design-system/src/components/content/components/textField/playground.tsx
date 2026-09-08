import { Box, TextField } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { textFieldItem } from '@/lib/registry'

export interface TextFieldPlaygroundState {
  required: boolean
  disabled: boolean
  invalid: boolean
  fullWidth: boolean
  description: boolean
  error: boolean
  [key: string]: boolean | string
}

const initialState: TextFieldPlaygroundState = {
  required: false,
  disabled: false,
  invalid: false,
  fullWidth: true,
  description: true,
  error: false,
}

const controls = [
  { kind: 'boolean', key: 'required', label: 'Required' },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'invalid', label: 'Invalid' },
  { kind: 'boolean', key: 'fullWidth', label: 'Full width' },
  { kind: 'boolean', key: 'description', label: 'Description' },
  { kind: 'boolean', key: 'error', label: 'Error' },
] as const satisfies readonly PlaygroundControl<TextFieldPlaygroundState>[]

export function serializeTextFieldPlayground(state: TextFieldPlaygroundState): string {
  const props = [
    'name="serverUrl"',
    'label="Server URL"',
    'placeholder="https://v2.sync.jazz.tools/"',
  ]
  if (state.description === true) {
    props.push('description="Sync server that stores your app data."')
  }
  if (state.error === true) props.push('error="Enter a valid server URL."')
  if (state.required === true) props.push('required')
  if (state.disabled === true) props.push('disabled')
  if (state.invalid === true) props.push('invalid')
  if (state.fullWidth === false) props.push('fullWidth={false}')

  return createPlaygroundSource({
    imports: { TextField: true },
    example: `(
    <TextField
      ${props.join('\n      ')}
    />
  )`,
  })
}

export function TextFieldPlayground(): ReactElement {
  const [state, setState] = useState<TextFieldPlaygroundState>(initialState)
  const preview = (
    <Box width="popup-width-m">
      <TextField
        name="serverUrl"
        label="Server URL"
        placeholder="https://v2.sync.jazz.tools/"
        description={
          state.description === true ? 'Sync server that stores your app data.' : undefined
        }
        error={state.error === true ? 'Enter a valid server URL.' : undefined}
        required={state.required}
        disabled={state.disabled}
        invalid={state.invalid}
        fullWidth={state.fullWidth}
      />
    </Box>
  )

  return (
    <ComponentDocsPage
      title={textFieldItem.title}
      description={textFieldItem.description}
      source={textFieldItem.source}
      preview={preview}
      sourceCode={serializeTextFieldPlayground(state)}
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
