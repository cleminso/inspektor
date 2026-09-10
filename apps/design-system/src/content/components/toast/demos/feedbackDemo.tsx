import { Box, Button, Toaster, toasts } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

export default function ToastFeedbackDemo(): ReactElement {
  const [rowDeleted, setRowDeleted] = useState(false)

  const deleteRow = (): void => {
    setRowDeleted(true)
    toasts.warning('Row deleted', {
      undo: () => setRowDeleted(false),
      preserve: true,
    })
  }

  return (
    <>
      <Box
        alignItems="center"
        flexWrap="wrap"
        gap="m"
      >
        <Button
          variant="secondary"
          onClick={() => toasts.message('Row inserted')}
        >
          Insert row
        </Button>
        <Button
          variant="secondary"
          onClick={() => toasts.success('Connection saved')}
        >
          Save connection
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toasts.error('Could not insert row', {
              description: 'Check the value and try again.',
              preserve: true,
            })
          }
        >
          Show error
        </Button>
        <Button
          variant="secondary"
          disabled={rowDeleted}
          onClick={deleteRow}
        >
          {rowDeleted === true ? 'Row deleted' : 'Delete row'}
        </Button>
      </Box>
      <Toaster />
    </>
  )
}
