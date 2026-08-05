import { Box, ScrollArea, Text } from '@inspector/ds'

const items = Array.from({ length: 12 }, (_, index) => `Scrollable item ${index + 1}`)

export default function BasicExample() {
  return (
    <Box width="popup-width-m" height="viewport-height-s">
      <ScrollArea aria-label="Scrollable items">
        <Box flexDirection="column" gap="m" padding="m">
          {items.map((item) => (
            <Text key={item}>{item}</Text>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  )
}
