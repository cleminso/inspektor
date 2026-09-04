import { DataGridFilterClause } from '@inspektor/ds'
import { type ReactElement } from 'react'

const value = 'a-complete-value-that-is-longer-than-the-visible-segment'
export default function LongValueExample(): ReactElement {
  return (
    <DataGridFilterClause.Root>
      <DataGridFilterClause.Trigger aria-label={`Edit filter identifier equals ${value}`}>
        <DataGridFilterClause.Column>identifier</DataGridFilterClause.Column>
        <DataGridFilterClause.Operator>=</DataGridFilterClause.Operator>
        <DataGridFilterClause.Value>{value}</DataGridFilterClause.Value>
      </DataGridFilterClause.Trigger>
      <DataGridFilterClause.Remove aria-label={`Remove filter identifier equals ${value}`} />
    </DataGridFilterClause.Root>
  )
}
