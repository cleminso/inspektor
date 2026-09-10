import { Box, Text } from '@inspektor/ds'
import { ArrowRight } from 'lucide-react'
import { type ReactElement } from 'react'

export default function TextDataDemo(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="m"
      width="popup-width-m"
      minWidth={0}
    >
      <Text
        formatter="compact"
        tabularNums
      >
        {1284000}
      </Text>
      <Text
        monospace
        truncate
      >
        co_zQ3k8mNV4pL7xW2cR9tY6sH1
      </Text>
      <Text trailingIcon={<ArrowRight />}>Open the selected connection</Text>
    </Box>
  )
}
