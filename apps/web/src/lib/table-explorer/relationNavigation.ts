/**
 * Builds explorer links from schema-declared relations to referenced rows.
 *
 * The Inspector does not need table-specific relation pages: Jazz reference metadata gives
 * the target table, and a URL filter on `id` lets the generic table explorer show the row.
 */
import type { TableFilterClause } from "@/types/tableFilters";
import { appRoutes } from "@/lib/navigation/appRoutes";

/** Reuses normal table filter state so relation navigation stays shareable. */
function buildRelationFilterClause(relationId: string): TableFilterClause {
  return {
    id: `relation-id-${relationId}`,
    column: "id",
    operator: "eq",
    value: relationId,
  };
}

/** Opens the referenced table with the same branch and schema hash as the current view. */
export function buildRelationTableLink(input: {
  connectionId: string;
  branch: string;
  schemaHash: string;
  tableName: string;
  relationId: string;
}) {
  return {
    to: appRoutes.table,
    params: {
      connectionId: input.connectionId,
      branch: input.branch,
      schemaHash: input.schemaHash,
      tableName: input.tableName,
    },
    search: {
      filters: JSON.stringify([buildRelationFilterClause(input.relationId)]),
      view: "data",
    },
  } as const;
}
