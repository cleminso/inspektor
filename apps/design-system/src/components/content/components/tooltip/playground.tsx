import { Button, Tooltip } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { tooltipItem } from '@/lib/registry'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
type TooltipAlign = 'start' | 'center' | 'end'

export interface TooltipPlaygroundState {
  side: TooltipSide
  align: TooltipAlign
  disabled: boolean
  closeOnClick: boolean
  [key: string]: boolean | string
}

const initialState: TooltipPlaygroundState = {
  side: 'top',
  align: 'center',
  disabled: false,
  closeOnClick: true,
}
const controls = [
  {
    kind: 'select',
    key: 'side',
    label: 'Side',
    options: ['top', 'right', 'bottom', 'left'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'align',
    label: 'Align',
    options: ['start', 'center', 'end'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'closeOnClick', label: 'Close on click' },
] as const satisfies readonly PlaygroundControl<TooltipPlaygroundState>[]

export function serializeTooltipPlayground(state: TooltipPlaygroundState): string {
  const triggerProps = [
    state.disabled === true ? 'disabled' : null,
    state.closeOnClick === false ? 'closeOnClick={false}' : null,
  ].filter((prop): prop is string => prop !== null)
  const contentProps = [
    state.side !== 'top' ? `side="${state.side}"` : null,
    state.align !== 'center' ? `align="${state.align}"` : null,
  ].filter((prop): prop is string => prop !== null)
  return createPlaygroundSource({
    imports: { Button: true, Tooltip: true },
    example: `(\n    <Tooltip.Provider>\n      <Tooltip.Root>\n        <Tooltip.Trigger render={<Button variant="secondary" />}${triggerProps.length > 0 ? ` ${triggerProps.join(' ')}` : ''}>Hover or focus</Tooltip.Trigger>\n        <Tooltip.Content${contentProps.length > 0 ? ` ${contentProps.join(' ')}` : ''}>Supplementary context</Tooltip.Content>\n      </Tooltip.Root>\n    </Tooltip.Provider>\n  )`,
  })
}

export function TooltipPlayground(): ReactElement {
  const [state, setState] = useState<TooltipPlaygroundState>(initialState)
  return (
    <ComponentDocsPage
      item={tooltipItem}
      preview={
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              render={<Button variant="secondary" />}
              disabled={state.disabled}
              closeOnClick={state.closeOnClick}
            >
              Hover or focus
            </Tooltip.Trigger>
            <Tooltip.Content
              side={state.side}
              align={state.align}
            >
              Supplementary context
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      }
      sourceCode={serializeTooltipPlayground(state)}
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
