import type { QueryOptions } from 'jazz-tools'

/** Requests a remote-tier opening; the canonical Jazz entry defines fulfillment readiness. */
export const INSPEKTOR_QUERY_OPTIONS = { tier: 'remote' } as const satisfies QueryOptions
