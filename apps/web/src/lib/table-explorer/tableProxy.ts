/**
 * Creates the minimal Jazz `TableProxy` for runtime-selected tables.
 *
 * App code imports generated proxies, but the Inspector only has a table name and stored
 * WASM schema. This proxy is the bridge that lets generic explorer code call Jazz APIs.
 */
import type { DynamicTableRow, TableProxy, WasmSchema } from "jazz-tools";

/** Supplies Jazz's table identity fields without introducing generated app types. */
export function createTableProxy(
  tableName: string,
  schema: WasmSchema,
): TableProxy<DynamicTableRow, Record<string, unknown>> {
  return {
    _table: tableName,
    _schema: schema,
    _rowType: undefined as unknown as DynamicTableRow,
    _initType: undefined as unknown as Record<string, unknown>,
  } as TableProxy<DynamicTableRow, Record<string, unknown>>;
}
