import {
  KeyboardInput,
  type KeyboardInputPlatform,
  type KeyboardInputSize,
  type KeyboardInputVariant,
} from '@inspektor/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { keyboardInputItem } from '@/lib/registry'

type KeyboardInputHotkey = 'Backspace' | 'Mod+K' | 'Mod+Shift+K' | 'Enter' | 'Escape'

export interface KeyboardInputPlaygroundState {
  hotkey: KeyboardInputHotkey
  platform: KeyboardInputPlatform
  size: KeyboardInputSize
  variant: KeyboardInputVariant
  [key: string]: boolean | string
}

const initialState: KeyboardInputPlaygroundState = {
  hotkey: 'Mod+K',
  platform: 'auto',
  size: 'default',
  variant: 'default',
}

const controls = [
  {
    kind: 'select',
    key: 'hotkey',
    label: 'Hotkey',
    options: ['Mod+K', 'Mod+Shift+K', 'Enter', 'Escape', 'Backspace'].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    kind: 'select',
    key: 'platform',
    label: 'Platform',
    options: ['auto', 'mac', 'windows', 'linux'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['default', 'small'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'variant',
    label: 'Variant',
    options: ['default', 'outline'].map((value) => ({ label: value, value })),
  },
] as const satisfies readonly PlaygroundControl<KeyboardInputPlaygroundState>[]

export function serializeKeyboardInputPlayground(state: KeyboardInputPlaygroundState): string {
  const props = [`hotkey="${state.hotkey}"`]
  if (state.platform !== 'auto') props.push(`platform="${state.platform}"`)
  if (state.size !== 'default') props.push(`size="${state.size}"`)
  if (state.variant !== 'default') props.push(`variant="${state.variant}"`)

  return createPlaygroundSource({
    imports: { KeyboardInput: true },
    example: `<KeyboardInput ${props.join(' ')} />`,
  })
}

export function KeyboardInputPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<KeyboardInputPlaygroundState>(initialState)

  return (
    <ComponentDocsPage
      title={keyboardInputItem.title}
      description={keyboardInputItem.description}
      source={keyboardInputItem.source}
      preview={
        <KeyboardInput
          hotkey={state.hotkey}
          platform={state.platform}
          size={state.size}
          variant={state.variant}
        />
      }
      sourceCode={serializeKeyboardInputPlayground(state)}
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
