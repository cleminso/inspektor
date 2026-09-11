import type { QueryOptions } from 'jazz-tools'

/** Leaves `tier` unset for local-first reads with full propagation and stable cache identity. */
export const INSPEKTOR_QUERY_OPTIONS = {} as const satisfies QueryOptions
