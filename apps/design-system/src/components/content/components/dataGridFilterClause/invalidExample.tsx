import { DataGridFilterClause } from '@inspector/ds'
import { type ReactElement } from 'react'

export default function InvalidExample(): ReactElement {
  return (
    <DataGridFilterClause.Root
      invalid
      invalidDescription="Column no longer exists."
    >
      <DataGridFilterClause.Trigger aria-label="Repair filter removed equals Ada">
        <DataGridFilterClause.Column>removed</DataGridFilterClause.Column>
        <DataGridFilterClause.Operator>=</DataGridFilterClause.Operator>
        <DataGridFilterClause.Value>Ada</DataGridFilterClause.Value>
      </DataGridFilterClause.Trigger>
      <DataGridFilterClause.Remove aria-label="Remove filter removed equals Ada" />
    </DataGridFilterClause.Root>
  )
}
