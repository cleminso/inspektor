import { Box, Textarea, type TextareaFont, type TextareaHeight } from '@inspector/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { textareaItem } from '@/lib/registry'

export interface TextareaPlaygroundState {
  height: TextareaHeight
  font: TextareaFont
  fullWidth: boolean
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  [key: string]: boolean | string
}

const initialState: TextareaPlaygroundState = {
  height: 'm',
  font: 'sans',
  fullWidth: true,
  invalid: false,
  disabled: false,
  readOnly: false,
}

const controls = [
  {
    kind: 'select',
    key: 'height',
    label: 'Height',
    options: ['s', 'm', 'l'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'font',
    label: 'Font',
    options: ['sans', 'mono'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'fullWidth', label: 'Full width' },
  { kind: 'boolean', key: 'invalid', label: 'Invalid' },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'readOnly', label: 'Read only' },
] as const satisfies readonly PlaygroundControl<TextareaPlaygroundState>[]

export function serializeTextareaPlayground(state: TextareaPlaygroundState): string {
  const props = ['aria-label="Notes"', 'placeholder="Add notes"']
  if (state.height !== 'm') props.push(`height="${state.height}"`)
  if (state.font !== 'sans') props.push(`font="${state.font}"`)
  if (state.fullWidth === false) props.push('fullWidth={false}')
  if (state.invalid === true) props.push('invalid')
  if (state.disabled === true) props.push('disabled')
  if (state.readOnly === true) props.push('readOnly')
  return createPlaygroundSource({
    imports: { Textarea: true },
    example: `<Textarea ${props.join(' ')} />`,
  })
}

export function TextareaPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<TextareaPlaygroundState>(initialState)
  const controlsPane = (
    <PlaygroundControls
      controls={controls}
      state={state}
      onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
      onReset={() => setState(initialState)}
    />
  )

  return (
    <ComponentDocsPage
      title={textareaItem.title}
      description={textareaItem.description}
      source={textareaItem.source}
      preview={
        <Box width="popup-width-m">
          <Textarea
            aria-label="Notes"
            placeholder="Add notes"
            {...state}
          />
        </Box>
      }
      sourceCode={serializeTextareaPlayground(state)}
      controls={controlsPane}
    >
      {children}
    </ComponentDocsPage>
  )
}
