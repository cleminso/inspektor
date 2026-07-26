/**
 * Resolves a referenced Jazz row for relation-cell display.
 *
 * The data explorer receives relation IDs from schema reference columns. This hook runs a
 * hidden generic query against the referenced table so the UI can show a friendlier label
 * while still linking by stable row ID.
 */
import { useMemo } from "react";

import type { DynamicTableRow } from "jazz-tools";
import { useAll } from "jazz-tools/react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { GenericQueryBuilder } from "@/lib/table-explorer/genericQueryBuilder";
import { getRelationDisplayColumn } from "@/lib/table-explorer/tableSchema";

const EMPTY_ROWS: DynamicTableRow[] = [];

/**
 * Why: `useAll` memoizes its subscription lookup on `[manager, query, queryOptions]`, so an
 * inline options literal defeats that memo on every render. This hook runs once per visible
 * relation cell, which made the unstable options identity the highest-frequency stability
 * leak in the explorer: each cell re-ran Jazz's subscription key computation on every render.
 *
 * How: the options have no inputs, so a module-scope constant provides one identity for the
 * whole app instead of one per mounted cell. This is the referential-stability contract's
 * module-constant case: identity is guaranteed by construction, without a memoization hook.
 *
 * What: every relation cell now passes the same options reference, so `useAll`'s internal
 * memo holds across unrelated renders and relation label lookups stop churning the
 * subscription cache key.
 */
const RELATION_QUERY_OPTIONS = {
  propagation: "full" as const,
  // Relation label lookups should not appear in the query-subscriptions telemetry being inspected.
  visibility: "hidden_from_live_query_list" as const,
};

/** Converts arbitrary dynamic row values into compact relation labels. */
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

export interface UseRelationRowResult {
  displayValue: string;
  row: DynamicTableRow | null;
}

/**
 * Fetches one referenced Jazz row and returns the best display value for a relation cell.
 *
 * The query is generic because the Inspector only knows the referenced table through
 * stored runtime schema metadata.
 */
export function useRelationRow(relationTable: string, relationId: string): UseRelationRowResult {
  const { runtime } = useInspector();

  const queryBuilder = useMemo(() => {
    if (runtime.wasmSchema === null) {
      return null;
    }

    return new GenericQueryBuilder(relationTable, runtime.wasmSchema).where({ id: relationId }).limit(1);
  }, [relationId, relationTable, runtime.wasmSchema]);

  const relationRows =
    useAll<DynamicTableRow>(queryBuilder ?? undefined, RELATION_QUERY_OPTIONS) ?? EMPTY_ROWS;
  const row = relationRows[0] ?? null;
  const displayColumn = useMemo(() => {
    return getRelationDisplayColumn(runtime.wasmSchema, relationTable);
  }, [relationTable, runtime.wasmSchema]);

  return {
    row,
    displayValue:
      row !== null && displayColumn !== null
        ? formatCellValue(row[displayColumn.name])
        : formatCellValue(relationId),
  };
}
