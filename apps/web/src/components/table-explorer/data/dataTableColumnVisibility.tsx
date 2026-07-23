import type { Table } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { Columns3 } from "lucide-react";

import { Button, Menu } from "@inspector/ds";

interface DataTableColumnVisibilityProps {
  table: Table<DynamicTableRow>;
}

export function DataTableColumnVisibility({ table }: DataTableColumnVisibilityProps): React.ReactElement {
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide() === true);

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="s"
            shape="square"
            aria-label="Choose visible columns"
          >
            <Columns3 aria-hidden="true" size={14} />
          </Button>
        }
      />
      <Menu.Content align="end">
        <Menu.Group>
          <Menu.GroupLabel>Columns</Menu.GroupLabel>
          {columns.map((column) => (
            <Menu.CheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => {
                column.toggleVisibility(checked === true);
              }}
            >
              <Menu.CheckboxItemIndicator />
              {column.id}
            </Menu.CheckboxItem>
          ))}
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  );
}
