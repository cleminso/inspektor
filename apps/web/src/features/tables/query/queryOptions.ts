import type { QueryOptions } from 'jazz-tools'

/** Shared values keep prefetch and rendered subscriptions on the same canonical Jazz cache key. */
export const INSPECTOR_QUERY_OPTIONS = {
  propagation: 'full',
  visibility: 'hidden_from_live_query_list',
} as const satisfies QueryOptions
