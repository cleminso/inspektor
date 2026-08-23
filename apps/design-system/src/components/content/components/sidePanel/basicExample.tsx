import { Button, Input, SidePanel, Text } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <SidePanel>
      <SidePanel.Header>
        <Input
          aria-label="Filter tables"
          placeholder="Filter"
          type="search"
          fullWidth
        />
      </SidePanel.Header>
      <SidePanel.Body>
        <Text color="muted">Scrollable panel content</Text>
      </SidePanel.Body>
      <SidePanel.Footer>
        <Button variant="secondary">Cancel</Button>
        <Button>Apply</Button>
      </SidePanel.Footer>
    </SidePanel>
  )
}
