/**
 * Converts Jazz query-subscriptions telemetry into table explorer links.
 *
 * Telemetry arrives as serialized query data rather than Inspector route state. This
 * adapter keeps the query-subscriptions page generic by recovering only filters the table explorer
 * already understands, then falling back to the plain table route when parsing fails.
 */
import { appRoutes } from '@app/routing/appRoutes'

import { extractFiltersFromIR } from '../telemetry/extractFiltersFromIr'

interface BuildTableExplorerLinkOptions {
  connectionId: string
  query: string
  tableName: string
}

/** Adds recovered query filters to the table link when telemetry exposes a supported relation IR. */
export function buildTableExplorerLink({
  connectionId,
  query,
  tableName,
}: BuildTableExplorerLinkOptions) {
  const link = {
    to: appRoutes.table,
    params: {
      connectionId,
      tableName,
    },
  } as const

  try {
    const parsedQuery = JSON.parse(query) as { relation_ir?: unknown }
    const filters = extractFiltersFromIR(parsedQuery.relation_ir)

    if (filters.length === 0) {
      return link
    }

    return {
      ...link,
      search: {
        filters: JSON.stringify(filters),
      },
    } as const
  } catch {
    return link
  }
}
