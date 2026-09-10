import { DataGridFilterClause } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function InvalidDataGridFilterClauseDemo(): ReactElement {
  return (
    <DataGridFilterClause.Root
      invalid
      invalidDescription="Choose a valid timestamp."
    >
      <DataGridFilterClause.Trigger aria-label="Edit invalid created at filter">
        <DataGridFilterClause.Column>created_at</DataGridFilterClause.Column>
        <DataGridFilterClause.Operator>&gt;</DataGridFilterClause.Operator>
        <DataGridFilterClause.Value>Invalid timestamp</DataGridFilterClause.Value>
      </DataGridFilterClause.Trigger>
      <DataGridFilterClause.Remove aria-label="Remove invalid created at filter" />
    </DataGridFilterClause.Root>
  )
}
