import { DataGridFilterClause } from "@inspector/ds";
import { type ReactElement } from "react";

export default function EditExample(): ReactElement {
  return (
    <DataGridFilterClause.Root>
      <DataGridFilterClause.Trigger aria-label="Edit filter name equals Ada">
        <DataGridFilterClause.Column>name</DataGridFilterClause.Column>
        <DataGridFilterClause.Operator>=</DataGridFilterClause.Operator>
        <DataGridFilterClause.Value>Ada</DataGridFilterClause.Value>
      </DataGridFilterClause.Trigger>
      <DataGridFilterClause.Remove aria-label="Remove filter name equals Ada" />
    </DataGridFilterClause.Root>
  );
}
