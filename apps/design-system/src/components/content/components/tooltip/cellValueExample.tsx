import { Box, Text, Tooltip } from '@inspector/ds'
import { type ReactElement } from 'react'

const value = 'usr_01J7HZ9Q4K6MW3T8V2P5N1BXCE'

export default function CellValueExample(): ReactElement {
  return (
    <Tooltip.Provider>
      <Box
        display="block"
        maxWidth="tooltip-width"
      >
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Text
                as="span"
                monospace
                truncate
              />
            }
          >
            {value}
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Text
              as="span"
              color="inherit"
              monospace
            >
              {value}
            </Text>
          </Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Tooltip.Provider>
  )
}
