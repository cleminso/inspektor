/**
 * Shared filter model for schema-driven table exploration.
 *
 * Filters are stored as generic clauses because the Inspector cannot rely on an
 * inspected app's generated Jazz query builders. UI controls create these clauses from
 * runtime schema metadata, then table helpers parse values and translate them into
 * generic query constraints.
 */

/** Operators exposed by the generic filter UI and supported by query translation. */
export type TableFilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "in"
  | "isNull";

/** One URL-serializable filter clause targeting a runtime schema column. */
export interface TableFilterClause {
  id: string;
  column: string;
  operator: TableFilterOperator;
  value: unknown;
}
