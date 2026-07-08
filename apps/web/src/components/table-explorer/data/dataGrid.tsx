// Passes `tableLayout` to reui
import type { Table } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";

import {
  DataGrid as Grid,
  DataGridContainer,
  DataGridScrollArea,
  DataGridTableVirtual,
} from "@regarde/ui/dataGrid";

interface DataGridProps {
  hasMore: boolean;
  isFetchingMore: boolean;
  loadedRowCount: number;
  onFetchMore: () => void;
  table: Table<DynamicTableRow>;
}

export function DataGrid({
  hasMore,
  isFetchingMore,
  loadedRowCount,
  onFetchMore,
  table,
}: DataGridProps): React.ReactElement {
  return (
    <Grid
      table={table}
      recordCount={loadedRowCount}
      tableLayout={{
        headerSticky: true,
        cellBorder: true,
        width: "auto",
      }}
      className="inspector-data-grid flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <DataGridContainer className="flex h-full min-h-0 min-w-0 flex-1 flex-col rounded-none border-0">
        <div className="data-grid-scroll-region relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <DataGridScrollArea className="app-scrollbar absolute inset-0 flex min-h-0 min-w-0 flex-col">
            <DataGridTableVirtual
              height="100%"
              onFetchMore={hasMore === true ? onFetchMore : undefined}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
              fetchMoreOffset={8}
            />
          </DataGridScrollArea>
        </div>
        <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <span>{loadedRowCount} rows loaded</span>
          {hasMore === true ? <span>Scroll to load more</span> : null}
        </div>
      </DataGridContainer>
    </Grid>
  );
}
