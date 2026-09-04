import { Box, Button } from '@inspektor/ds'
import { type ReactElement } from 'react'

const sizes = ['xs', 's', 'm'] as const

export default function VariantsExample(): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="xl"
    >
      {sizes.map((size) => (
        <Box
          key={size}
          alignItems="center"
          flexWrap="wrap"
          gap="l"
        >
          <Button size={size}>Primary</Button>
          <Button
            size={size}
            variant="secondary"
          >
            Secondary
          </Button>
          <Button
            size={size}
            variant="danger"
          >
            Danger
          </Button>
          <Button
            size={size}
            variant="ghost"
          >
            Ghost
          </Button>
          <Button
            size={size}
            variant="link"
          >
            Link
          </Button>
        </Box>
      ))}
    </Box>
  )
}
