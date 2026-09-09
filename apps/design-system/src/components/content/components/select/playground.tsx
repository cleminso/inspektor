import { Box, Select, type SelectTriggerSize, type SelectWidth } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { selectItem } from '@/lib/registry'

export interface SelectPlaygroundState {
  size: SelectTriggerSize
  width: SelectWidth
  disabled: boolean
  [key: string]: boolean | string
}

const initialState: SelectPlaygroundState = {
  size: 'l',
  width: 'content',
  disabled: false,
}

const options = [
  { label: 'Main', value: 'main' },
  { label: 'Develop', value: 'develop' },
  { label: 'Schema preview', value: 'schema-preview' },
]

const controls = [
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['xs', 's', 'm', 'l'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'width',
    label: 'Width',
    options: ['content', 'full'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
] as const satisfies readonly PlaygroundControl<SelectPlaygroundState>[]

export function serializeSelectPlayground(state: SelectPlaygroundState): string {
  const rootProps = ['items={options}', 'defaultValue="main"']
  const triggerProps = ['aria-label="Branch"', 'placeholder="Select a branch"']
  const itemProps = ['key={option.value}', 'value={option.value}']
  if (state.disabled === true) rootProps.push('disabled')
  if (state.size !== 'l') triggerProps.push(`size="${state.size}"`)
  if (state.width !== 'content') triggerProps.push(`width="${state.width}"`)

  return createPlaygroundSource({
    imports: { Select: true },
    declarations: `const options = [
  { label: "Main", value: "main" },
  { label: "Develop", value: "develop" },
  { label: "Schema preview", value: "schema-preview" },
];`,
    example: `(
    <Select.Root ${rootProps.join(' ')}>
      <Select.Trigger ${triggerProps.join(' ')} />
      <Select.Content>
        {options.map((option) => (
          <Select.Item ${itemProps.join(' ')}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )`,
  })
}

export function SelectPlayground(): ReactElement {
  const [state, setState] = useState<SelectPlaygroundState>(initialState)
  const preview = (
    <Box>
      <Select.Root
        items={options}
        defaultValue="main"
        disabled={state.disabled}
      >
        <Select.Trigger
          aria-label="Branch"
          placeholder="Select a branch"
          size={state.size}
          width={state.width}
        />
        <Select.Content>
          {options.map((option) => (
            <Select.Item
              key={option.value}
              value={option.value}
            >
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Box>
  )

  return (
    <ComponentDocsPage
      item={selectItem}
      preview={preview}
      sourceCode={serializeSelectPlayground(state)}
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
