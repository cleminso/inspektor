import {
  Combobox,
  type ComboboxPopupWidth,
  type ComboboxViewportHeight,
  Field,
} from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { comboboxItem } from '@/lib/registry'

const branches = ['main', 'develop', 'feature/schema-view', 'fix/connection-state']

export interface ComboboxPlaygroundState {
  width: ComboboxPopupWidth
  maxHeight: ComboboxViewportHeight
  disabled: boolean
  required: boolean
  [key: string]: boolean | string
}

const initialState: ComboboxPlaygroundState = {
  width: 'anchor',
  maxHeight: 'm',
  disabled: false,
  required: false,
}

const controls = [
  {
    kind: 'select',
    key: 'width',
    label: 'Popup width',
    options: ['anchor', 'content', 's', 'm', 'l'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'maxHeight',
    label: 'Maximum height',
    options: ['s', 'm', 'l', 'available'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'required', label: 'Required' },
] as const satisfies readonly PlaygroundControl<ComboboxPlaygroundState>[]

export function serializeComboboxPlayground(state: ComboboxPlaygroundState): string {
  const rootProps = [
    state.disabled === true ? 'disabled' : null,
    state.required === true ? 'required' : null,
  ].filter((prop): prop is string => prop !== null)
  const contentProp = state.width !== 'anchor' ? ` width="${state.width}"` : ''
  const viewportProp = state.maxHeight !== 'm' ? ` maxHeight="${state.maxHeight}"` : ''
  return createPlaygroundSource({
    imports: { Combobox: true, Field: true },
    declarations: `const branches = ["main", "develop", "feature/schema-view", "fix/connection-state"];`,
    example: `(\n    <Field.Root name="branch">\n      <Field.Label>Branch</Field.Label>\n      <Combobox.Root items={branches} defaultValue="develop"${rootProps.length > 0 ? ` ${rootProps.join(' ')}` : ''}>\n        <Combobox.InputGroup>\n          <Combobox.Input placeholder="Find a branch" />\n          <Combobox.InputTrigger />\n        </Combobox.InputGroup>\n        <Combobox.Content${contentProp}>\n          <Combobox.Viewport${viewportProp}>\n            <Combobox.Empty>No branches found.</Combobox.Empty>\n            <Combobox.List>\n              {(branch: string) => (\n                <Combobox.Item key={branch} value={branch}>{branch}</Combobox.Item>\n              )}\n            </Combobox.List>\n          </Combobox.Viewport>\n        </Combobox.Content>\n      </Combobox.Root>\n    </Field.Root>\n  )`,
  })
}

export function ComboboxPlayground(): ReactElement {
  const [state, setState] = useState<ComboboxPlaygroundState>(initialState)
  const preview = (
    <Field.Root name="branch">
      <Field.Label>Branch</Field.Label>
      <Combobox.Root
        items={branches}
        defaultValue="develop"
        disabled={state.disabled}
        required={state.required}
      >
        <Combobox.InputGroup>
          <Combobox.Input placeholder="Find a branch" />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content width={state.width}>
          <Combobox.Viewport maxHeight={state.maxHeight}>
            <Combobox.Empty>No branches found.</Combobox.Empty>
            <Combobox.List>
              {(branch: string) => (
                <Combobox.Item
                  key={branch}
                  value={branch}
                >
                  {branch}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Viewport>
        </Combobox.Content>
      </Combobox.Root>
    </Field.Root>
  )
  return (
    <ComponentDocsPage
      item={comboboxItem}
      preview={preview}
      sourceCode={serializeComboboxPlayground(state)}
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
