import { Box, ScrollArea, Text } from '@inspektor/ds'

const items = Array.from({ length: 8 }, (_, index) => `Wide row ${index + 1}`)

export default function BothAxesExample() {
  return (
    <Box
      width="popup-width-m"
      height="viewport-height-s"
    >
      <ScrollArea
        axis="both"
        aria-label="Two-axis content"
      >
        <Box
          width="content-measure"
          flexDirection="column"
          gap="m"
          padding="m"
        >
          {items.map((item) => (
            <Text key={item}>{item} · Content retains its intrinsic width</Text>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  )
}
