import { RelationValue } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  return (
    <RelationValue
      id="account_0123456789"
      navigation={{ href: '#relation-target' }}
    />
  )
}
