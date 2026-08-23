import { Button, Menu, type MenuPopupWidth } from '@inspector/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { menuItem } from '@/lib/registry'

type PopupSide = 'top' | 'right' | 'bottom' | 'left'
type PopupAlign = 'start' | 'center' | 'end'

export interface MenuPlaygroundState {
  width: MenuPopupWidth
  side: PopupSide
  align: PopupAlign
  disabled: boolean
  danger: boolean
  [key: string]: boolean | string
}

const initialState: MenuPlaygroundState = {
  width: 'content',
  side: 'bottom',
  align: 'start',
  disabled: false,
  danger: true,
}

const controls = [
  {
    kind: 'select',
    key: 'width',
    label: 'Width',
    options: ['content', 'anchor'].map((value) => ({ label: value, value })),
  },
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
] as const satisfies readonly PlaygroundControl<MenuPlaygroundState>[]

export function serializeMenuPlayground(state: MenuPlaygroundState): string {
  const rootProp = state.disabled === true ? ' disabled' : ''
  const contentProps = [
    state.width !== 'content' ? `width="${state.width}"` : null,
    state.side !== 'bottom' ? `side="${state.side}"` : null,
    state.align !== 'start' ? `align="${state.align}"` : null,
  ].filter((prop): prop is string => prop !== null)
  const contentOpen =
    contentProps.length === 0 ? '<Menu.Content>' : `<Menu.Content ${contentProps.join(' ')}>`
  const dangerProp = state.danger === true ? ' variant="danger"' : ''

  return createPlaygroundSource({
    imports: { Button: true, Menu: true },
    example: `(\n    <Menu.Root${rootProp}>\n      <Menu.Trigger render={<Button variant="secondary" />}>Actions</Menu.Trigger>\n      ${contentOpen}\n        <Menu.Item onClick={() => undefined}>Rename</Menu.Item>\n        <Menu.Item${dangerProp} onClick={() => undefined}>Delete</Menu.Item>\n      </Menu.Content>\n    </Menu.Root>\n  )`,
  })
}

export function MenuPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<MenuPlaygroundState>(initialState)
  const preview = (
    <Menu.Root disabled={state.disabled}>
      <Menu.Trigger render={<Button variant="secondary" />}>Actions</Menu.Trigger>
      <Menu.Content
        width={state.width}
        side={state.side}
        align={state.align}
      >
        <Menu.Item onClick={() => undefined}>Rename</Menu.Item>
        <Menu.Item
          variant={state.danger === true ? 'danger' : 'default'}
          onClick={() => undefined}
        >
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  )

  return (
    <ComponentDocsPage
      title={menuItem.title}
      description={menuItem.description}
      source={menuItem.source}
      preview={preview}
      sourceCode={serializeMenuPlayground(state)}
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
