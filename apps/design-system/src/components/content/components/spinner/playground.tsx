import { Spinner, type SpinnerSize } from '@inspector/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { spinnerItem } from '@/lib/registry'

export interface SpinnerPlaygroundState {
  size: SpinnerSize
  [key: string]: boolean | string
}

const initialState: SpinnerPlaygroundState = { size: 'm' }

const controls = [
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['s', 'm', 'l'].map((value) => ({ label: value, value })),
  },
] as const satisfies readonly PlaygroundControl<SpinnerPlaygroundState>[]

export function serializeSpinnerPlayground(state: SpinnerPlaygroundState): string {
  const size = state.size === 'm' ? '' : ` size="${state.size}"`
  return createPlaygroundSource({
    imports: { Spinner: true },
    example: `<Spinner label="Loading"${size} />`,
  })
}

export function SpinnerPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<SpinnerPlaygroundState>(initialState)
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
      title={spinnerItem.title}
      description={spinnerItem.description}
      source={spinnerItem.source}
      preview={
        <Spinner
          label="Loading"
          size={state.size}
        />
      }
      sourceCode={serializeSpinnerPlayground(state)}
      controls={controlsPane}
    >
      {children}
    </ComponentDocsPage>
  )
}
