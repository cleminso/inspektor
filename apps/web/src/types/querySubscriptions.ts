/**
 * Shared shapes for Jazz query subscription telemetry.
 *
 * The sync server reports active query subscriptions grouped by table, query, branch, and
 * propagation context. Keeping that response in shared types lets the telemetry hook,
 * table list, and detail grid agree on the same generic model without depending on an
 * inspected app's generated schema types.
 */

/** A telemetry group representing matching active query-subscriptions subscriptions. */
export interface QuerySubscriptionRow {
  branches: string[];
  count: number;
  groupKey: string;
  propagation: string;
  query: string;
  table: string;
}

export type QuerySubscriptionPropagation = "full" | "local-only";
