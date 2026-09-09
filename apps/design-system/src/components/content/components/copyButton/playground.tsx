import {
  Box,
  CopyButton,
  type CopyButtonProps,
  type CopyButtonSize,
  type CopyButtonVariant,
  Text,
} from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { copyButtonItem } from '@/lib/registry'

type TooltipSide = NonNullable<CopyButtonProps['tooltipSide']>

export interface CopyButtonPlaygroundState {
  variant: CopyButtonVariant
  size: CopyButtonSize
  tooltipSide: TooltipSide
  disabled: boolean
  [key: string]: boolean | string
}

const initialState: CopyButtonPlaygroundState = {
  variant: 'ghost',
  size: 's',
  tooltipSide: 'top',
  disabled: false,
}

const controls = [
  {
    kind: 'select',
    key: 'variant',
    label: 'Variant',
    options: ['ghost', 'secondary'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['xs', 's', 'm'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'tooltipSide',
    label: 'Tooltip side',
    options: ['top', 'right', 'bottom', 'left'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
] as const satisfies readonly PlaygroundControl<CopyButtonPlaygroundState>[]

export function serializeCopyButtonPlayground(state: CopyButtonPlaygroundState): string {
  const props = [
    'textToCopy={schemaHash}',
    'label="Copy schema hash"',
    state.variant !== 'ghost' ? `variant="${state.variant}"` : null,
    state.size !== 's' ? `size="${state.size}"` : null,
    state.tooltipSide !== 'top' ? `tooltipSide="${state.tooltipSide}"` : null,
    state.disabled === true ? 'disabled' : null,
  ].filter((prop): prop is string => prop !== null)
  const copyButton =
    props.length === 2
      ? `<CopyButton ${props.join(' ')} />`
      : `<CopyButton\n    ${props.join('\n    ')}\n  />`

  return createPlaygroundSource({
    imports: { Box: true, CopyButton: true, Text: true },
    declarations: 'const schemaHash = "sha256:41f17cc82ca";',
    example: `(\n    <Box alignItems="center" gap="xs">\n      <Text as="code" monospace>\n        {schemaHash}\n      </Text>\n      ${copyButton}\n    </Box>\n  )`,
  })
}

export function CopyButtonPlayground(): ReactElement {
  const [state, setState] = useState<CopyButtonPlaygroundState>(initialState)
  const preview = (
    <Box
      alignItems="center"
      gap="xs"
    >
      <Text
        as="code"
        monospace
      >
        sha256:41f17cc82ca
      </Text>
      <CopyButton
        textToCopy="sha256:41f17cc82ca"
        label="Copy schema hash"
        variant={state.variant}
        size={state.size}
        tooltipSide={state.tooltipSide}
        disabled={state.disabled}
      />
    </Box>
  )

  return (
    <ComponentDocsPage
      item={copyButtonItem}
      preview={preview}
      sourceCode={serializeCopyButtonPlayground(state)}
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
