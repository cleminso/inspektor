import { Button, toasts } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function PreserveExample(): ReactElement {
  return (
    <Button
      variant="secondary"
      onClick={() => toasts.message('Inspector connection lost', { preserve: true })}
    >
      Show preserved toast
    </Button>
  )
}
