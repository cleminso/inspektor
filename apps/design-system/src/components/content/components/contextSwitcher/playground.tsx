import {
  ContextSwitcher,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
  type ComboboxPopupWidth,
  type ComboboxViewportHeight,
} from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { contextSwitcherItem } from '@/lib/registry'

const branches = ['main', 'develop', 'feature/schema-view', 'fix/connection-state']

export interface ContextSwitcherPlaygroundState {
  size: ContextSwitcherTriggerSize
  triggerWidth: ContextSwitcherTriggerWidth
  contentWidth: ComboboxPopupWidth
  maxHeight: ComboboxViewportHeight
  disabled: boolean
  [key: string]: boolean | string
}

const initialState: ContextSwitcherPlaygroundState = {
  size: 'm',
  triggerWidth: 'content',
  contentWidth: 'm',
  maxHeight: 'm',
  disabled: false,
}
const controls = [
  {
    kind: 'select',
    key: 'size',
    label: 'Trigger size',
    options: ['s', 'm'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'triggerWidth',
    label: 'Trigger width',
    options: ['content', 's', 'm'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'contentWidth',
    label: 'Content width',
    options: ['anchor', 'content', 's', 'm', 'l'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'maxHeight',
    label: 'Maximum height',
    options: ['s', 'm', 'l', 'available'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
] as const satisfies readonly PlaygroundControl<ContextSwitcherPlaygroundState>[]

export function serializeContextSwitcherPlayground(state: ContextSwitcherPlaygroundState): string {
  const triggerProps = [
    'label="Switch branch"',
    state.size !== 'm' ? `size="${state.size}"` : null,
    state.triggerWidth !== 'content' ? `width="${state.triggerWidth}"` : null,
  ].filter((prop): prop is string => prop !== null)
  const contentProp = state.contentWidth !== 'm' ? ` width="${state.contentWidth}"` : ''
  const viewportProp = state.maxHeight !== 'm' ? ` maxHeight="${state.maxHeight}"` : ''

  return createPlaygroundSource({
    imports: { ContextSwitcher: true },
    declarations: `const branches = ["main", "develop", "feature/schema-view", "fix/connection-state"];`,
    example: `(\n    <ContextSwitcher.Root items={branches} defaultValue="main"${state.disabled === true ? ' disabled' : ''}>\n      <ContextSwitcher.Trigger ${triggerProps.join(' ')}>\n        <ContextSwitcher.Value placeholder="Select branch" />\n      </ContextSwitcher.Trigger>\n      <ContextSwitcher.Content${contentProp}>\n        <ContextSwitcher.Search label="Search branches" placeholder="Search branches" />\n        <ContextSwitcher.Viewport${viewportProp}>\n          <ContextSwitcher.List>\n            {(branch: string) => (\n              <ContextSwitcher.Item key={branch} value={branch}>{branch}</ContextSwitcher.Item>\n            )}\n          </ContextSwitcher.List>\n        </ContextSwitcher.Viewport>\n      </ContextSwitcher.Content>\n    </ContextSwitcher.Root>\n  )`,
  })
}

export function ContextSwitcherPlayground(): ReactElement {
  const [state, setState] = useState<ContextSwitcherPlaygroundState>(initialState)
  const preview = (
    <ContextSwitcher.Root
      items={branches}
      defaultValue="main"
      disabled={state.disabled}
    >
      <ContextSwitcher.Trigger
        label="Switch branch"
        size={state.size}
        width={state.triggerWidth}
      >
        <ContextSwitcher.Value placeholder="Select branch" />
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content width={state.contentWidth}>
        <ContextSwitcher.Search
          label="Search branches"
          placeholder="Search branches"
        />
        <ContextSwitcher.Viewport maxHeight={state.maxHeight}>
          <ContextSwitcher.List>
            {(branch: string) => (
              <ContextSwitcher.Item
                key={branch}
                value={branch}
              >
                {branch}
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  )
  return (
    <ComponentDocsPage
      item={contextSwitcherItem}
      preview={preview}
      sourceCode={serializeContextSwitcherPlayground(state)}
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
