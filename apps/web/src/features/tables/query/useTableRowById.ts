import { useMemo } from "react";

import type { DynamicTableRow } from "jazz-tools";
import { useAll } from "jazz-tools/react";

import { useInspector } from "@app/providers/inspectorProvider";
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
  const { runtime } = useInspector();
  const queryBuilder = useMemo(() => {
    if (runtime.wasmSchema === null || rowId === null) {
      return null;
    }

    return new GenericQueryBuilder(tableName, runtime.wasmSchema)
      .where({ id: rowId })
      .limit(1)
      .offset(0);
  }, [rowId, runtime.wasmSchema, tableName]);
  const queryOptions = useMemo(
    () => ({
      propagation: "full" as const,
      visibility: "hidden_from_live_query_list" as const,
    }),
    [],
  );
  const rows = useAll<DynamicTableRow>(queryBuilder ?? undefined, queryOptions);

  if (rowId === null) {
    return null;
  }

  return rows?.find((row) => String(row.id) === rowId) ?? null;
}
