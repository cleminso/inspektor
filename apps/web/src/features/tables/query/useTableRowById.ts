import { useMemo } from "react";

import type { DynamicTableRow } from "jazz-tools";

import { useRuntimeClient, useRuntimeSchema } from "@app/providers/inspectorProvider";
import { useJazzQueryState } from "@tables/query/useJazzQueryState";
import type { TableRowId } from "@tables/tableTypes";

import { GenericQueryBuilder } from "./genericQueryBuilder";

interface UseTableRowByIdOptions {
  rowId: TableRowId | null;
  tableName: string;
}

export function useTableRowById({
  rowId,
  tableName,
}: UseTableRowByIdOptions): DynamicTableRow | null {
  const client = useRuntimeClient();
  const wasmSchema = useRuntimeSchema();
  const queryBuilder = useMemo(() => {
    if (wasmSchema === null || rowId === null) {
      return null;
    }

    return new GenericQueryBuilder(tableName, wasmSchema)
      .where({ id: rowId })
      .limit(1)
      .offset(0);
  }, [rowId, tableName, wasmSchema]);
  const queryOptions = useMemo(
    () => ({
      propagation: "full" as const,
      visibility: "hidden_from_live_query_list" as const,
    }),
    [],
  );
  const queryState = useJazzQueryState<DynamicTableRow>(
    client?.manager ?? null,
    queryBuilder ?? undefined,
    queryOptions,
  );

  if (rowId === null) {
    return null;
  }

  return queryState.data?.find((row) => String(row.id) === rowId) ?? null;
}
