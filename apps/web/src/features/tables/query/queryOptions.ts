import type { QueryOptions } from 'jazz-tools'

/** Waits for the serving authority before presenting populated or empty table results. */
export const INSPEKTOR_QUERY_OPTIONS = { tier: 'remote' } as const satisfies QueryOptions
