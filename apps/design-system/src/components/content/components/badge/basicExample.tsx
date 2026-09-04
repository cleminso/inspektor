import { Badge } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <>
      <Badge>Latest</Badge>
      <Badge size="xs">prod</Badge>
    </>
  )
}
