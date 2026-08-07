/**
 * Derives table navigation data from the active Inspector runtime schema.
 *
 * Jazz table names come from stored WASM schema metadata, so this hook provides a small
 * React-facing API for routes and sidebars that only need table availability.
 */
import { useMemo } from "react";

import { useRuntimeSchema } from "@app/providers/inspectorProvider";
import { getTableNames } from "@tables/schema/tableSchema";

interface UseAvailableTablesResult {
  tables: string[];
  hasTables: boolean;
  isSchemaReady: boolean;
}

/**
 * Reads table navigation data from the active Inspector runtime.
 *
 * The Inspector does not import generated app schema code. Instead, it gets table names
 * from the runtime schema projection, which is the Jazz stored schema metadata loaded for the
 * active connection and schema hash.
 */
export function useAvailableTables(): UseAvailableTablesResult {
  const wasmSchema = useRuntimeSchema();

  return useMemo(() => {
    const tables = getTableNames(wasmSchema);

    return {
      tables,
      hasTables: tables.length > 0,
      // Distinguishes "schema still loading" from "schema loaded but contains no tables".
      isSchemaReady: wasmSchema !== null,
    };
  }, [wasmSchema]);
}
