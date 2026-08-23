import { Box, Input, InputGroup, type InputSize } from '@inspector/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { inputGroupItem } from '@/lib/registry'

export interface InputGroupPlaygroundState {
  size: InputSize
  fullWidth: boolean
  disabled: boolean
  invalid: boolean
  prefix: boolean
  suffix: boolean
  [key: string]: boolean | string
}

const initialState: InputGroupPlaygroundState = {
  size: 'm',
  fullWidth: false,
  disabled: false,
  invalid: false,
  prefix: true,
  suffix: true,
}

const controls = [
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['s', 'm', 'l'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'fullWidth', label: 'Full width' },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'invalid', label: 'Invalid' },
  { kind: 'boolean', key: 'prefix', label: 'Prefix' },
  { kind: 'boolean', key: 'suffix', label: 'Suffix' },
] as const satisfies readonly PlaygroundControl<InputGroupPlaygroundState>[]

export function serializeInputGroupPlayground(state: InputGroupPlaygroundState): string {
  const props: string[] = []
  if (state.size !== 'm') props.push(`size="${state.size}"`)
  if (state.fullWidth === true) props.push('fullWidth')
  if (state.disabled === true) props.push('disabled')
  if (state.invalid === true) props.push('invalid')
  const root = props.length === 0 ? '<InputGroup>' : `<InputGroup ${props.join(' ')}>`
  const prefix =
    state.prefix === true ? '\n      <InputGroup.Prefix>https://</InputGroup.Prefix>' : ''
  const suffix = state.suffix === true ? '\n      <InputGroup.Suffix>.com</InputGroup.Suffix>' : ''

  return createPlaygroundSource({
    imports: { Input: true, InputGroup: true },
    example: `(
    ${root}${prefix}
      <Input aria-label="Domain" placeholder="example" />${suffix}
    </InputGroup>
  )`,
  })
}

export function InputGroupPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<InputGroupPlaygroundState>(initialState)
  const preview = (
    <Box width="popup-width-m">
      <InputGroup
        size={state.size}
        fullWidth={state.fullWidth}
        disabled={state.disabled}
        invalid={state.invalid}
      >
        {state.prefix === true ? <InputGroup.Prefix>https://</InputGroup.Prefix> : null}
        <Input
          aria-label="Domain"
          placeholder="example"
        />
        {state.suffix === true ? <InputGroup.Suffix>.com</InputGroup.Suffix> : null}
      </InputGroup>
    </Box>
  )

  return (
    <ComponentDocsPage
      title={inputGroupItem.title}
      description={inputGroupItem.description}
      source={inputGroupItem.source}
      preview={preview}
      sourceCode={serializeInputGroupPlayground(state)}
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
