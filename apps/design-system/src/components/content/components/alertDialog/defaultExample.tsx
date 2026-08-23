import { AlertDialog, Button } from '@inspector/ds'
import { type ReactElement, useState } from 'react'

export default function DefaultExample(): ReactElement {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setOpen(true)}
      >
        Delete connection
      </Button>
      <AlertDialog.Root
        open={open}
        onOpenChange={setOpen}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Delete connection?</AlertDialog.Title>
          <AlertDialog.Description>
            This removes the saved connection. You cannot undo this action.
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Close>Cancel</AlertDialog.Close>
            <AlertDialog.Close render={<Button variant="danger" />}>
              Delete connection
            </AlertDialog.Close>
          </AlertDialog.Actions>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}
