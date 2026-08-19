import { Box, Button, DataGridFilterClause } from "@inspector/ds";
import { type ReactElement } from "react";

const clauses = [
  ["y_client_id", "!=", "id"],
  ["room_id", "!=", "general"],
  ["provider_instance_id", "contains", "analytics"],
  ["createdAt", ">", "August 18"],
] as const;

export default function OverflowExample(): ReactElement {
  return (
    <Box alignItems="center" gap="xs" minWidth={0} width="full">
      <DataGridFilterClause.List aria-label="Applied table filters">
        {clauses.map(([column, operator, value]) => (
          <DataGridFilterClause.Root key={column}>
            <DataGridFilterClause.Trigger aria-label={`Edit filter ${column} ${operator} ${value}`}>
              <DataGridFilterClause.Column>{column}</DataGridFilterClause.Column>
              <DataGridFilterClause.Operator>{operator}</DataGridFilterClause.Operator>
              <DataGridFilterClause.Value>{value}</DataGridFilterClause.Value>
            </DataGridFilterClause.Trigger>
            <DataGridFilterClause.Remove aria-label={`Remove filter ${column} ${operator} ${value}`} />
          </DataGridFilterClause.Root>
        ))}
      </DataGridFilterClause.List>
      <Box flexShrink={0}>
        <Button layout="row" size="s" variant="ghost">Add more filters</Button>
      </Box>
    </Box>
  );
}
