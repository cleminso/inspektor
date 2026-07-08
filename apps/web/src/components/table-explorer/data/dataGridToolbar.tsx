import type { Table } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";

import { Button } from "@regarde/ui/button";
import { Checkbox } from "@regarde/ui/checkbox";
import { DataGridColumnVisibility } from "@regarde/ui/dataGrid";

interface DataGridToolbarProps {
  infiniteScrollEnabled?: boolean;
  onInfiniteScrollEnabledChange?: (enabled: boolean) => void;
  table: Table<DynamicTableRow>;
}

export function DataGridToolbar({
  infiniteScrollEnabled = true,
  onInfiniteScrollEnabledChange,
  table,
}: DataGridToolbarProps): React.ReactElement {
  const canToggleInfiniteScroll = onInfiniteScrollEnabledChange !== undefined;

  return (
    <>
      {canToggleInfiniteScroll === true ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={infiniteScrollEnabled}
            onCheckedChange={(checked) => {
              onInfiniteScrollEnabledChange(checked);
            }}
          />
          Infinite scroll
        </label>
      ) : null}
      <DataGridColumnVisibility
        table={table}
        trigger={
          <Button type="button" variant="ghost" size="sm">
            Columns
          </Button>
        }
      />
    </>
  );
}
