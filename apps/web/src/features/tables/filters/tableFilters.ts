/**
 * Shared filter model for schema-driven table exploration.
 *
 * Filters are stored as generic clauses because the Inspektor cannot rely on an
 * inspected app's generated Jazz query builders. UI controls create these clauses from
 * runtime schema metadata, then table helpers parse values and translate them into
 * generic query constraints.
 */

import type { WhereOperator } from 'jazz-tools'

/** Operators exposed by the generic filter UI and supported by query translation. */
export type TableFilterOperator = WhereOperator

/** Runtime operator list used to reject malformed URL-backed clauses. */
export const tableFilterOperators = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
  'isNull',
] as const satisfies readonly TableFilterOperator[]

/** One URL-serializable filter clause targeting a runtime schema column. */
export interface TableFilterClause {
  id: string
  column: string
  operator: TableFilterOperator
  value: unknown
}
