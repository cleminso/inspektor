import {
  Box,
  ResizableHandle,
  type ResizableHandleAppearance,
  ResizablePanel,
  ResizablePanelGroup,
  type ResizablePanelGroupProps,
  Text,
} from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { resizablePanelItem } from '@/lib/registry'

type ResizablePanelOrientation = NonNullable<ResizablePanelGroupProps['orientation']>

export interface ResizablePanelPlaygroundState {
  orientation: ResizablePanelOrientation
  appearance: ResizableHandleAppearance
  disabled: boolean
  collapsible: boolean
  [key: string]: boolean | string
}

const initialState: ResizablePanelPlaygroundState = {
  orientation: 'horizontal',
  appearance: 'line',
  disabled: false,
  collapsible: false,
}

const controls = [
  {
    kind: 'select',
    key: 'orientation',
    label: 'Orientation',
    options: ['horizontal', 'vertical'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'appearance',
    label: 'Handle',
    options: ['line', 'gutter', 'grip'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'collapsible', label: 'Collapsible' },
] as const satisfies readonly PlaygroundControl<ResizablePanelPlaygroundState>[]

export function serializeResizablePanelPlayground(state: ResizablePanelPlaygroundState): string {
  const groupProps = [
    state.orientation !== 'horizontal' ? `orientation="${state.orientation}"` : null,
    state.disabled === true ? 'disabled' : null,
  ].filter((prop): prop is string => prop !== null)
  const groupOpen =
    groupProps.length === 0
      ? '<ResizablePanelGroup>'
      : `<ResizablePanelGroup ${groupProps.join(' ')}>`
  const panelProps = [
    'defaultSize="40%"',
    'minSize="25%"',
    state.collapsible === true ? 'collapsible' : null,
  ].filter((prop): prop is string => prop !== null)
  const handle =
    state.appearance === 'line'
      ? '<ResizableHandle />'
      : `<ResizableHandle appearance="${state.appearance}" />`

  return createPlaygroundSource({
    imports: {
      Box: true,
      ResizableHandle: true,
      ResizablePanel: true,
      ResizablePanelGroup: true,
      Text: true,
    },
    example: `(\n    <Box width="full" height="viewport-height-m" borderWidth={1} borderStyle="solid" borderColor="default">\n      ${groupOpen}\n        <ResizablePanel ${panelProps.join(' ')}>\n          <Box height="full" alignItems="center" justifyContent="center" backgroundColor="element-default">\n            <Text>Navigation</Text>\n          </Box>\n        </ResizablePanel>\n        ${handle}\n        <ResizablePanel>\n          <Box height="full" alignItems="center" justifyContent="center">\n            <Text>Content</Text>\n          </Box>\n        </ResizablePanel>\n      </ResizablePanelGroup>\n    </Box>\n  )`,
  })
}

export function ResizablePanelPlayground(): ReactElement {
  const [state, setState] = useState<ResizablePanelPlaygroundState>(initialState)
  const preview = (
    <Box
      width="full"
      height="viewport-height-m"
      borderWidth={1}
      borderStyle="solid"
      borderColor="default"
    >
      <ResizablePanelGroup
        orientation={state.orientation}
        disabled={state.disabled}
      >
        <ResizablePanel
          defaultSize="40%"
          minSize="25%"
          collapsible={state.collapsible}
        >
          <Box
            height="full"
            alignItems="center"
            justifyContent="center"
            backgroundColor="element-default"
          >
            <Text>Navigation</Text>
          </Box>
        </ResizablePanel>
        <ResizableHandle appearance={state.appearance} />
        <ResizablePanel>
          <Box
            height="full"
            alignItems="center"
            justifyContent="center"
          >
            <Text>Content</Text>
          </Box>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Box>
  )

  return (
    <ComponentDocsPage
      item={resizablePanelItem}
      preview={preview}
      sourceCode={serializeResizablePanelPlayground(state)}
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
