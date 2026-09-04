import { Button, ButtonGroup } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function OrientationExample(): ReactElement {
  return (
    <ButtonGroup
      orientation="vertical"
      aria-label="Zoom controls"
    >
      <Button variant="secondary">Zoom in</Button>
      <Button variant="secondary">Reset zoom</Button>
      <Button variant="secondary">Zoom out</Button>
    </ButtonGroup>
  )
}
