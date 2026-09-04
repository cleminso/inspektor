import { Box, JsonView } from '@inspektor/ds'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { jsonViewItem } from '@/lib/registry'

type ExpandDepth = '0' | '1' | '2'

export interface JsonViewPlaygroundState {
  expandDepth: ExpandDepth
  [key: string]: boolean | string
}

const data = {
  account: { id: 'account_01', role: 'admin' },
  permissions: ['read', 'write'],
}

const expandDepthByValue = { '0': 0, '1': 1, '2': 2 } as const
const initialState: JsonViewPlaygroundState = { expandDepth: '1' }
const controls = [
  {
    kind: 'select',
    key: 'expandDepth',
    label: 'Initial depth',
    options: ['0', '1', '2'].map((value) => ({ label: value, value })),
  },
] as const satisfies readonly PlaygroundControl<JsonViewPlaygroundState>[]

export function serializeJsonViewPlayground(state: JsonViewPlaygroundState): string {
  const props = [
    'accessibilityLabel="Account payload"',
    'data={data}',
    state.expandDepth === '1' ? null : `defaultExpandDepth={${state.expandDepth}}`,
  ].filter((prop): prop is string => prop !== null)

  return createPlaygroundSource({
    imports: { JsonView: true },
    declarations: `const data = {
  account: { id: "account_01", role: "admin" },
  permissions: ["read", "write"],
};`,
    example: `<JsonView\n    ${props.join('\n    ')}\n  />`,
  })
}

export function JsonViewPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<JsonViewPlaygroundState>(initialState)

  return (
    <ComponentDocsPage
      title={jsonViewItem.title}
      description={jsonViewItem.description}
      source={jsonViewItem.source}
      preview={
        <Box
          width="popup-width-m"
          minWidth={0}
        >
          <JsonView
            accessibilityLabel="Account payload"
            data={data}
            defaultExpandDepth={expandDepthByValue[state.expandDepth]}
          />
        </Box>
      }
      sourceCode={serializeJsonViewPlayground(state)}
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
