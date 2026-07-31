import type { Table } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { Settings2 } from "lucide-react";

import { Button, Icon, MultiSelect, type MultiSelectItem } from "@inspector/ds";

interface DataGridColumnVisibilityProps {
  table: Table<DynamicTableRow>;
}

export function DataGridColumnVisibility({
  table,
}: DataGridColumnVisibilityProps): React.ReactElement {
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
            aria-label="Choose visible columns"
            iconOnly
          />
        }
      >
        <Icon render={<Settings2 />} size="s" />
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
