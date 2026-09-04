import { Button, Tooltip } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function PositionExample(): ReactElement {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger render={<Button variant="secondary" />}>Hover or focus</Tooltip.Trigger>
        <Tooltip.Content
          side="right"
          align="center"
        >
          Supplementary context
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
