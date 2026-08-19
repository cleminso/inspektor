import { DataGridFilterClause } from "@inspector/ds";
import { type ReactElement } from "react";

export default function CreateExample(): ReactElement {
  return (
    <DataGridFilterClause.Root>
      <DataGridFilterClause.Trigger aria-label="Edit filter created at after August 18">
        <DataGridFilterClause.Column>created_at</DataGridFilterClause.Column>
        <DataGridFilterClause.Operator>&gt;</DataGridFilterClause.Operator>
        <DataGridFilterClause.Value>2026-08-18</DataGridFilterClause.Value>
      </DataGridFilterClause.Trigger>
      <DataGridFilterClause.Remove aria-label="Remove filter created at after August 18" />
    </DataGridFilterClause.Root>
  );
}
