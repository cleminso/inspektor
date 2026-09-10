import { Box, StructuredValuePreview } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function StructuredValuePreviewModelsDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
    >
      <StructuredValuePreview
        model={{
          kind: 'object',
          totalCount: 3,
          entries: [
            { label: 'enabled', value: 'true' },
            { label: 'retries', value: '3' },
            { label: 'region', value: '"eu-west"' },
          ],
          continuation: 'complete',
        }}
      />
      <StructuredValuePreview
        model={{
          kind: 'array',
          totalCount: 4,
          entries: ['"Ada"', '3', 'true'],
          continuation: 'truncated',
        }}
      />
      <StructuredValuePreview
        model={{ kind: 'scalar', label: 'Account', continuation: 'complete' }}
        variant="typedJson"
      />
      <StructuredValuePreview
        model={{ kind: 'array', totalCount: 0, entries: [], continuation: 'complete' }}
      />
    </Box>
  )
}
