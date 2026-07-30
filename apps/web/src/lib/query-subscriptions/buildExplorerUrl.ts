/**
 * Converts Jazz query-subscriptions telemetry into table explorer links.
 *
 * Telemetry arrives as serialized query data rather than Inspector route state. This
 * adapter keeps the query-subscriptions page generic by recovering only filters the table explorer
 * already understands, then falling back to the plain table route when parsing fails.
 */
import { appRoutes } from "@/lib/navigation/appRoutes";

import { extractFiltersFromIR } from "./extractFiltersFromIR";

interface BuildExplorerLinkOptions {
  connectionId: string;
  query: string;
  tableName: string;
}

/** Adds recovered query filters to the table link when telemetry exposes a supported relation IR. */
export function buildExplorerLink({
  connectionId,
  query,
  tableName,
}: BuildExplorerLinkOptions) {
  const link = {
    to: appRoutes.table,
    params: {
      connectionId,
      tableName,
    },
  } as const;

  try {
    const parsedQuery = JSON.parse(query) as { relation_ir?: unknown };
    const filters = extractFiltersFromIR(parsedQuery.relation_ir);

    if (filters.length === 0) {
      return link;
    }

    return {
      ...link,
      search: {
        filters: JSON.stringify(filters),
      },
    } as const;
  } catch {
    return link;
  }
}
