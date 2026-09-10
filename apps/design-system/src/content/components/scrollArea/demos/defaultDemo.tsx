import { Box, ScrollArea, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

const tables = Array.from({ length: 12 }, (_, index) => `Table ${index + 1}`)

export default function ScrollAreaDefaultDemo(): ReactElement {
  return (
    <Box
      width="popup-width-m"
      height="viewport-height-s"
    >
      <ScrollArea aria-label="Database tables">
        <Box
          flexDirection="column"
          gap="m"
          padding="m"
        >
          {tables.map((table) => (
            <Text key={table}>{table}</Text>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  )
}
