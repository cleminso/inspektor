/**
 * Schema-driven Jazz query builder for Inspektor table exploration.
 *
 * Inspected apps can rely on generated typed builders; the Inspektor cannot because it
 * loads arbitrary schemas at runtime. This builder implements Jazz's `QueryBuilder` shape
 * from table names, column names, and stored schema metadata.
 */
import type { DynamicTableRow, QueryBuilder, WasmSchema } from 'jazz-tools'

type GenericWhereInput = Record<string, Record<string, unknown>>

/** Adapts runtime schema metadata to Jazz's generated-builder contract without app-specific types. */
export class GenericQueryBuilder implements QueryBuilder<DynamicTableRow> {
  readonly _table: string
  readonly _schema: WasmSchema
  // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- Jazz requires a type-only row marker with no runtime value.
  readonly _rowType: DynamicTableRow = undefined as unknown as DynamicTableRow

  private conditions: Array<{ column: string; op: string; value: unknown }> = []
  private orderBys: Array<[string, 'asc' | 'desc']> = []
  private limitValue: number | undefined
  private offsetValue: number | undefined

  public constructor(tableName: string, schema: WasmSchema) {
    this._table = tableName
    this._schema = schema
  }

  /** Accepts Inspektor filter state as explicit Jazz operators. */
  public where(conditions: GenericWhereInput): GenericQueryBuilder {
    const clone = this.clone()

    for (const [key, operators] of Object.entries(conditions)) {
      for (const [operator, value] of Object.entries(operators)) {
        if (value !== undefined) clone.conditions.push({ column: key, op: operator, value })
      }
    }

    return clone
  }

  public orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): GenericQueryBuilder {
    const clone = this.clone()
    clone.orderBys.push([column, direction])
    return clone
  }

  public limit(value: number): GenericQueryBuilder {
    const clone = this.clone()
    clone.limitValue = value
    return clone
  }

  public offset(value: number): GenericQueryBuilder {
    const clone = this.clone()
    clone.offsetValue = value
    return clone
  }

  /** Emits the minimal query payload Jazz needs for table rows selected at runtime. */
  public _build(): string {
    return JSON.stringify(
      {
        table: this._table,
        conditions: this.conditions,
        includes: {},
        orderBy: this.orderBys,
        limit: this.limitValue,
        offset: this.offsetValue,
        hops: [],
      },
      (_key, value) => (value instanceof Uint8Array ? [...value] : value),
    )
  }

  /** Matches generated builder chaining semantics by keeping every query step immutable. */
  private clone(): GenericQueryBuilder {
    const clone = new GenericQueryBuilder(this._table, this._schema)
    clone.conditions = [...this.conditions]
    clone.orderBys = [...this.orderBys]
    clone.limitValue = this.limitValue
    clone.offsetValue = this.offsetValue
    return clone
  }
}
