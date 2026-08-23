import { Box, StructuredValuePreview } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="l"
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
        variant="typedJson"
      />
    </Box>
  )
}
