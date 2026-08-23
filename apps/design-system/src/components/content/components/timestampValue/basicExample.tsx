import { TimestampValue } from '@inspector/ds'
import { type ReactElement } from 'react'

const value = new Date('2024-01-15T14:30:00Z')

export default function BasicExample(): ReactElement {
  return <TimestampValue value={value} />
}
