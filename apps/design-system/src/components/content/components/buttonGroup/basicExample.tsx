import { Button, ButtonGroup, ButtonGroupText } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <ButtonGroup aria-label="Document actions">
      <ButtonGroupText>Document</ButtonGroupText>
      <Button variant="secondary">Archive</Button>
      <Button variant="secondary">Report</Button>
      <Button variant="secondary">Snooze</Button>
    </ButtonGroup>
  )
}
