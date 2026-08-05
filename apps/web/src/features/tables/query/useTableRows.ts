/**
 * Runs schema-driven table queries for the Inspector data explorer.
 *
 * The hook turns route search state into a generic Jazz query, derives render columns from
 * stored schema metadata, and loads rows incrementally without app-generated table types.
 */
import { useMemo, useRef, useState } from "react";

import { useAll } from "jazz-tools/react";
import { type DynamicTableRow } from "jazz-tools";

import { useInspector } from "@app/providers/inspectorProvider";
import { GenericQueryBuilder } from "@tables/query/genericQueryBuilder";
import { useTableExplorerSearchParams } from "@tables/routing/useTableSearchParams";
import { getTableColumns } from "@tables/schema/tableSchema";
import type { TableColumnMeta } from "@tables/tableTypes";

const DEFAULT_CHUNK_SIZE = 50;
const EMPTY_ROWS: DynamicTableRow[] = [];

/** Returns whether the generic query builder can sort this Jazz column type. */
function isColumnSortable(columnType: ReturnType<typeof getTableColumns>[number]["column_type"]): boolean {
  switch (columnType.type) {
    case "Integer":
    case "BigInt":
    case "Double":
    case "Boolean":
    case "Text":
    case "Enum":
    case "Timestamp":
    case "Uuid":
      return true;
    default:
      return false;
  }
}

export interface UseTableRowsOptions {
  chunkSize?: number;
  tableName: string | null;
}

export interface UseTableRowsResult {
  columns: TableColumnMeta[];
  fetchMore: () => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  loadedRowCount: number;
  resetLoadedRows: () => void;
  rows: DynamicTableRow[];
}

interface RequestedRowCountState {
  queryKey: string;
  rowCount: number;
}

interface ResolvedRowsState {
  dataScopeKey: string;
  queryKey: string;
  requestedRowCount: number;
  rows: DynamicTableRow[];
}

/**
 * Provides columns, rows, and incremental loading controls for one Inspector table.
 *
 * The hook derives columns from stored Jazz runtime schema metadata and builds a generic
 * query from URL-backed filters and sorting, avoiding inspected-app generated code.
 */
export function useTableRows({
  chunkSize = DEFAULT_CHUNK_SIZE,
  tableName,
}: UseTableRowsOptions): UseTableRowsResult {
  const { currentSchemaHash, runtime } = useInspector();
  const { filters, sortColumn, sortDirection } = useTableExplorerSearchParams();
  // Reset incremental loading when the table, schema hash, or URL query state changes.
  const queryKey = useMemo(
    () => JSON.stringify({ chunkSize, currentSchemaHash, filters, sortColumn, sortDirection, tableName }),
    [chunkSize, currentSchemaHash, filters, sortColumn, sortDirection, tableName],
  );
  const dataScopeKey = useMemo(
    () => JSON.stringify({ chunkSize, currentSchemaHash, filters, tableName }),
    [chunkSize, currentSchemaHash, filters, tableName],
  );
  const [requestedRowCountState, setRequestedRowCountState] = useState<RequestedRowCountState>(() => ({
    queryKey,
    rowCount: chunkSize,
  }));
  const requestedRowCount = requestedRowCountState.queryKey === queryKey ? requestedRowCountState.rowCount : chunkSize;

  const schemaColumns = useMemo(
    () => getTableColumns(runtime.wasmSchema, tableName),
    [runtime.wasmSchema, tableName],
  );

  const columns = useMemo<TableColumnMeta[]>(() => {
    const idColumn: TableColumnMeta = {
      id: "id",
      label: "id",
      accessorKey: "id",
      column: null,
      isSortable: true,
    };

    return [
      idColumn,
      ...schemaColumns.map((column) => ({
        id: column.name,
        label: column.name,
        accessorKey: column.name,
        column,
        isSortable: isColumnSortable(column.column_type),
      })),
    ];
  }, [schemaColumns]);

  const queryBuilder = useMemo(() => {
    if (runtime.wasmSchema === null || tableName === null) {
      return null;
    }

    let builder = new GenericQueryBuilder(tableName, runtime.wasmSchema);
    for (const filter of filters) {
      if (filter.operator === "eq") {
        builder = builder.where({ [filter.column]: filter.value });
      } else {
        builder = builder.where({
          [filter.column]: {
            [filter.operator]: filter.value,
          },
        });
      }
    }

    return builder
      .orderBy(sortColumn, sortDirection)
      // Fetch one extra row to know whether the UI should offer "load more".
      .limit(requestedRowCount + 1)
      .offset(0);
  }, [filters, requestedRowCount, runtime.wasmSchema, sortColumn, sortDirection, tableName]);

  const queryOptions = useMemo(() => {
    return {
      propagation: "full" as const,
      // Explorer reads should not pollute the server telemetry view the user is inspecting.
      visibility: "hidden_from_live_query_list" as const,
    };
  }, []);

  const rows = useAll<DynamicTableRow>(queryBuilder ?? undefined, queryOptions);
  const resolvedRowsRef = useRef<ResolvedRowsState | null>(null);
  if (rows !== undefined) {
    resolvedRowsRef.current = {
      dataScopeKey,
      queryKey,
      requestedRowCount,
      rows,
    };
  }
  const previousRowsState = resolvedRowsRef.current;
  const canPreserveRows =
    rows === undefined && previousRowsState?.dataScopeKey === dataScopeKey;
  const resolvedRows = rows ?? (canPreserveRows === true ? previousRowsState.rows : EMPTY_ROWS);
  const hasMore = resolvedRows.length > requestedRowCount;
  const visibleRows = useMemo(
    () => (hasMore === true ? resolvedRows.slice(0, requestedRowCount) : resolvedRows),
    [hasMore, requestedRowCount, resolvedRows],
  );
  const isInitialLoading = rows === undefined && canPreserveRows === false;
  const isRefreshing =
    rows === undefined && canPreserveRows === true && previousRowsState.queryKey !== queryKey;
  const isFetchingMore =
    rows === undefined &&
    canPreserveRows === true &&
    previousRowsState.queryKey === queryKey &&
    requestedRowCount > previousRowsState.requestedRowCount;

  return {
    columns,
    rows: visibleRows,
    loadedRowCount: visibleRows.length,
    hasMore,
    isFetchingMore,
    isInitialLoading,
    isRefreshing,
    fetchMore: () => {
      if (hasMore === false || rows === undefined) {
        return;
      }

      setRequestedRowCountState((currentState) => ({
        queryKey,
        rowCount: (currentState.queryKey === queryKey ? currentState.rowCount : chunkSize) + chunkSize,
      }));
    },
    resetLoadedRows: () => {
      setRequestedRowCountState({ queryKey, rowCount: chunkSize });
    },
  };
}
