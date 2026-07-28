import { useMemo } from "react";

import type { DynamicTableRow } from "jazz-tools";
import { useAll } from "jazz-tools/react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { GenericQueryBuilder } from "@/lib/table-explorer/genericQueryBuilder";
import { getRelationDisplayColumn } from "@/lib/table-explorer/tableSchema";

const EMPTY_ROWS: DynamicTableRow[] = [];

const RELATION_QUERY_OPTIONS = {
  propagation: "full" as const,
  // Relation label lookups should not appear in the query-subscriptions telemetry being inspected.
  visibility: "hidden_from_live_query_list" as const,
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export type RelationResolution =
  | { status: "pending" }
  | { status: "resolved"; displayValue: string }
  | { status: "missing" };

export function useRelationRow(relationTable: string, relationId: string): RelationResolution {
  const { runtime } = useInspector();

  const queryBuilder = useMemo(() => {
    if (runtime.wasmSchema === null) {
      return null;
    }

    return new GenericQueryBuilder(relationTable, runtime.wasmSchema).where({ id: relationId }).limit(1);
  }, [relationId, relationTable, runtime.wasmSchema]);

  const queryResult = useAll<DynamicTableRow>(queryBuilder ?? undefined, RELATION_QUERY_OPTIONS);
  const relationRows = queryResult ?? EMPTY_ROWS;
  const row = relationRows[0] ?? null;
  const displayColumn = useMemo(() => {
    return getRelationDisplayColumn(runtime.wasmSchema, relationTable);
  }, [relationTable, runtime.wasmSchema]);

  const displayValue =
    row !== null && displayColumn !== null
      ? formatCellValue(row[displayColumn.name])
      : formatCellValue(relationId);
  const resolution: RelationResolution =
    queryResult === undefined
      ? { status: "pending" }
      : row === null
        ? { status: "missing" }
        : { status: "resolved", displayValue };

  return resolution;
}
