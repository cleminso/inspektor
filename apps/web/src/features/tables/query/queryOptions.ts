import type { QueryOptions } from 'jazz-tools'

/**
 * Shared Jazz query policy for inspected data.
 *
 * Full propagation is required for admin inspection, while hidden visibility keeps Inspector-owned
 * reads out of the inspected application's live-query list. These options participate in Jazz query
 * identity, so all consumers of the same table query must use this object.
 */
export const INSPECTOR_QUERY_OPTIONS = {
  propagation: 'full',
  visibility: 'hidden_from_live_query_list',
} as const satisfies QueryOptions
