import { Switch, type SwitchSize } from '@inspektor/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { switchItem } from '@/lib/registry'

export interface SwitchPlaygroundState {
  size: SwitchSize
  checked: boolean
  disabled: boolean
  readOnly: boolean
  [key: string]: boolean | string
}

const initialState: SwitchPlaygroundState = {
  size: 'm',
  checked: false,
  disabled: false,
  readOnly: false,
}

const controls = [
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['s', 'm'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'checked', label: 'Checked' },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'readOnly', label: 'Read only' },
] as const satisfies readonly PlaygroundControl<SwitchPlaygroundState>[]

export function serializeSwitchPlayground(state: SwitchPlaygroundState): string {
  const props = ['aria-label="Notifications"']
  if (state.size !== 'm') props.push(`size="${state.size}"`)
  if (state.checked === true) props.push('checked')
  if (state.disabled === true) props.push('disabled')
  if (state.readOnly === true) props.push('readOnly')
  return createPlaygroundSource({
    imports: { Switch: true },
    example: `<Switch ${props.join(' ')} />`,
  })
}

export function SwitchPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<SwitchPlaygroundState>(initialState)
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
      title={switchItem.title}
      description={switchItem.description}
      source={switchItem.source}
      preview={
        <Switch
          aria-label="Notifications"
          {...state}
        />
      }
      sourceCode={serializeSwitchPlayground(state)}
      controls={controlsPane}
    >
      {children}
    </ComponentDocsPage>
  )
}
