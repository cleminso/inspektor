import type { Table } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { Settings2 } from "lucide-react";

import { Button, MultiSelect, type MultiSelectItem } from "@inspector/ds";

interface DataTableColumnVisibilityProps {
  table: Table<DynamicTableRow>;
}

export function DataTableColumnVisibility({ table }: DataTableColumnVisibilityProps): React.ReactElement {
  const columns = table.getAllLeafColumns().filter((column) => column.id !== "_select");
  const items: readonly MultiSelectItem[] = columns.map((column) => ({
    disabled: column.getCanHide() === false,
    label: column.id,
    value: column.id,
  }));
  const visibleColumnIds = columns
    .filter((column) => column.getIsVisible() === true)
    .map((column) => column.id);

  return (
    <MultiSelect.Root
      items={items}
      value={visibleColumnIds}
      onValueChange={(nextVisibleColumnIds) => {
        const nextVisibleColumnIdSet = new Set(nextVisibleColumnIds);
        table.setColumnVisibility(
          Object.fromEntries(
            columns.map((column) => [
              column.id,
              column.getCanHide() === false || nextVisibleColumnIdSet.has(column.id),
            ]),
          ),
        );
      }}
    >
      <MultiSelect.Trigger
        label="Choose visible columns"
        render={
          <Button
            type="button"
            variant="ghost"
            size="s"
            shape="square"
            aria-label="Choose visible columns"
          />
        }
      >
        <Settings2 aria-hidden="true" size={14} />
      </MultiSelect.Trigger>
      <MultiSelect.Content
        align="end"
        emptyLabel="columns"
        label="Visible columns"
        searchLabel="Search columns"
        searchPlaceholder="Search columns..."
      />
    </MultiSelect.Root>
  );
}
