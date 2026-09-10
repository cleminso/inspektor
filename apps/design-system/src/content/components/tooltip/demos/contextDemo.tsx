import { Box, Button, Tooltip } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function TooltipDefaultDemo(): ReactElement {
  return (
    <Tooltip.Provider>
      <Box
        alignItems="center"
        flexWrap="wrap"
        gap="m"
      >
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="secondary" />}>Top</Tooltip.Trigger>
          <Tooltip.Content side="top">Shows the complete connection URL</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="secondary" />}>Bottom</Tooltip.Trigger>
          <Tooltip.Content side="bottom">Includes inherited table permissions</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="secondary" />}>Left</Tooltip.Trigger>
          <Tooltip.Content side="left">Uses the selected workspace</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="secondary" />}>Right</Tooltip.Trigger>
          <Tooltip.Content side="right">Keeps the active schema in view</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    </Tooltip.Provider>
  )
}
