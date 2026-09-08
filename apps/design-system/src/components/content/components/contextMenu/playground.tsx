import { ContextMenu } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { contextMenuItem } from '@/lib/registry'

type PopupSide = 'top' | 'right' | 'bottom' | 'left'
type PopupAlign = 'start' | 'center' | 'end'

export interface ContextMenuPlaygroundState {
  side: PopupSide
  align: PopupAlign
  disabled: boolean
  danger: boolean
  [key: string]: boolean | string
}

const initialState: ContextMenuPlaygroundState = {
  side: 'bottom',
  align: 'start',
  disabled: false,
  danger: true,
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
  { kind: 'boolean', key: 'danger', label: 'Danger action' },
] as const satisfies readonly PlaygroundControl<ContextMenuPlaygroundState>[]

export function serializeContextMenuPlayground(state: ContextMenuPlaygroundState): string {
  const contentProps = [
    state.side !== 'bottom' ? `side="${state.side}"` : null,
    state.align !== 'start' ? `align="${state.align}"` : null,
  ].filter((prop): prop is string => prop !== null)
  const contentOpen =
    contentProps.length === 0
      ? '<ContextMenu.Content>'
      : `<ContextMenu.Content ${contentProps.join(' ')}>`
  return createPlaygroundSource({
    imports: { ContextMenu: true },
    example: `(\n    <ContextMenu.Root${state.disabled === true ? ' disabled' : ''}>\n      <ContextMenu.Trigger>Right-click this tab</ContextMenu.Trigger>\n      ${contentOpen}\n        <ContextMenu.Item onClick={() => undefined}>Rename tab</ContextMenu.Item>\n        <ContextMenu.Item${state.danger === true ? ' variant="danger"' : ''} onClick={() => undefined}>Close tab</ContextMenu.Item>\n      </ContextMenu.Content>\n    </ContextMenu.Root>\n  )`,
  })
}

export function ContextMenuPlayground(): ReactElement {
  const [state, setState] = useState<ContextMenuPlaygroundState>(initialState)
  return (
    <ComponentDocsPage
      title={contextMenuItem.title}
      description={contextMenuItem.description}
      source={contextMenuItem.source}
      preview={
        <ContextMenu.Root disabled={state.disabled}>
          <ContextMenu.Trigger>Right-click this tab</ContextMenu.Trigger>
          <ContextMenu.Content
            side={state.side}
            align={state.align}
          >
            <ContextMenu.Item onClick={() => undefined}>Rename tab</ContextMenu.Item>
            <ContextMenu.Item
              variant={state.danger === true ? 'danger' : 'default'}
              onClick={() => undefined}
            >
              Close tab
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      }
      sourceCode={serializeContextMenuPlayground(state)}
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
