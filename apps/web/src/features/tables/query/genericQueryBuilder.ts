/**
 * Schema-driven Jazz query builder for Inspector table exploration.
 *
 * Inspected apps can rely on generated typed builders; the Inspector cannot because it
 * loads arbitrary schemas at runtime. This builder implements Jazz's `QueryBuilder` shape
 * from table names, column names, and stored schema metadata.
 */
import type { DynamicTableRow, QueryBuilder, WasmSchema } from "jazz-tools";

export type GenericWhereValue = unknown | { [op: string]: unknown };

export type GenericWhereInput = Record<string, GenericWhereValue>;

/** QueryBuilder implementation for subscriptions against runtime-selected tables. */
export class GenericQueryBuilder implements QueryBuilder<DynamicTableRow> {
  readonly _table: string;
  readonly _schema: WasmSchema;
  readonly _rowType: DynamicTableRow = undefined as unknown as DynamicTableRow;

  private conditions: Array<{ column: string; op: string; value: unknown }> = [];
  private orderBys: Array<[string, "asc" | "desc"]> = [];
  private limitValue: number | undefined;
  private offsetValue: number | undefined;

  public constructor(tableName: string, schema: WasmSchema) {
    this._table = tableName;
    this._schema = schema;
  }

  /** Accepts Inspector filter state as either shorthand equality or explicit Jazz operators. */
  public where(conditions: GenericWhereInput): GenericQueryBuilder {
    const clone = this.clone();

    for (const [key, value] of Object.entries(conditions)) {
      if (value === undefined) {
        continue;
      }

      const isOperatorRecord =
        typeof value === "object" &&
        value !== null &&
        Array.isArray(value) === false &&
        Object.getPrototypeOf(value) === Object.prototype;

      if (isOperatorRecord === true) {
        const operatorRecord = value as Record<string, unknown>;
        for (const [operator, operatorValue] of Object.entries(operatorRecord)) {
          if (operatorValue === undefined) {
            continue;
          }

          clone.conditions.push({ column: key, op: operator, value: operatorValue });
        }

        continue;
      }

      clone.conditions.push({ column: key, op: "eq", value });
    }

    return clone;
  }

  public orderBy(column: string, direction: "asc" | "desc" = "asc"): GenericQueryBuilder {
    const clone = this.clone();
    clone.orderBys.push([column, direction]);
    return clone;
  }

  public limit(value: number): GenericQueryBuilder {
    const clone = this.clone();
    clone.limitValue = value;
    return clone;
  }

  public offset(value: number): GenericQueryBuilder {
    const clone = this.clone();
    clone.offsetValue = value;
    return clone;
  }

  /** Emits the minimal query payload Jazz needs for table rows selected at runtime. */
  public _build(): string {
    return JSON.stringify({
      table: this._table,
      conditions: this.conditions,
      includes: {},
      orderBy: this.orderBys,
      limit: this.limitValue,
      offset: this.offsetValue,
      hops: [],
    });
  }

  /** Matches generated builder chaining semantics by keeping every query step immutable. */
  private clone(): GenericQueryBuilder {
    const clone = new GenericQueryBuilder(this._table, this._schema);
    clone.conditions = [...this.conditions];
    clone.orderBys = [...this.orderBys];
    clone.limitValue = this.limitValue;
    clone.offsetValue = this.offsetValue;
    return clone;
  }
}
