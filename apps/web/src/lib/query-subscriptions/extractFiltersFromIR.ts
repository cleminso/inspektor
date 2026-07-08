/**
 * Extracts Inspector filter clauses from Jazz relation IR.
 *
 * query-subscriptions telemetry exposes Jazz's internal query shape, while the table explorer uses
 * URL-serializable filter clauses. This parser recognizes the comparison subset that maps
 * cleanly to generic `where` filters and ignores unknown IR so telemetry links still work.
 */

/** Filter shape shared with table route search params without importing route code. */
export interface QuerySubscriptionsFilterClause {
  column: string;
  id: string;
  operator: string;
  value: unknown;
}

const irOpToFilterOp: Record<string, string> = {
  Eq: "eq",
  Ne: "ne",
  Gt: "gt",
  Gte: "gte",
  Lt: "lt",
  Lte: "lte",
};

/** Walks nested IR nodes because supported comparisons may be wrapped in `And` or planner nodes. */
export function extractFiltersFromIR(node: unknown): QuerySubscriptionsFilterClause[] {
  if (node === null || node === undefined || typeof node !== "object") {
    return [];
  }

  const objectNode = node as Record<string, unknown>;

  if ("Cmp" in objectNode && objectNode.Cmp !== null && typeof objectNode.Cmp === "object") {
    const cmp = objectNode.Cmp as Record<string, unknown>;
    const left = cmp.left as Record<string, unknown> | undefined;
    const right = cmp.right as Record<string, unknown> | undefined;
    const operator = irOpToFilterOp[String(cmp.op)];
    const column = typeof left?.column === "string" ? left.column : undefined;
    const literal = right?.Literal as Record<string, unknown> | undefined;

    if (operator !== undefined && column !== undefined && literal !== undefined && "value" in literal) {
      return [{ id: `ir-${column}`, column, operator, value: literal.value }];
    }

    return [];
  }

  if ("And" in objectNode && Array.isArray(objectNode.And) === true) {
    return objectNode.And.flatMap((child) => extractFiltersFromIR(child));
  }

  const filters: QuerySubscriptionsFilterClause[] = [];
  for (const value of Object.values(objectNode)) {
    if (value !== null && typeof value === "object") {
      filters.push(...extractFiltersFromIR(value));
    }
  }

  return filters;
}
