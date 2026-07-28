/**
 * Wraps generic Jazz table mutations for the schema-driven data explorer.
 *
 * The Inspector builds a dynamic table proxy from stored schema metadata, then uses Jazz's
 * mutation runtime to insert, update, and delete rows without app-generated table code.
 */
import { useMemo, useState } from "react";

import { useDb } from "jazz-tools/react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { createTableProxy } from "@/lib/table-explorer/tableProxy";

export interface UseTableMutationsResult {
  error: string | null;
  isPending: boolean;
  deleteRow: (rowId: string) => Promise<void>;
  insertRow: (values: Record<string, unknown>) => Promise<void>;
  updateRow: (rowId: string, values: Record<string, unknown>) => Promise<void>;
}

/**
 * Drops `undefined` properties defensively before the Jazz boundary.
 *
 * Jazz also omits top-level `undefined` fields. Explicit `null` is retained because it represents
 * SQL NULL, while an absent property lets inserts use a stored default and leaves updates untouched.
 */
function omitUndefinedValues(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

/**
 * Provides insert, update, and delete actions for one schema-driven Inspector table.
 *
 * The hook converts stored runtime schema metadata into a dynamic Jazz table proxy, then
 * exposes mutation state that forms can use before closing panels or clearing input. For example,
 * an update `{ name: "Grace" }` reaches Jazz as a one-column patch; this hook never reconstructs
 * the rest of the row.
 */
export function useTableMutations(tableName: string): UseTableMutationsResult {
  const db = useDb();
  const { runtime } = useInspector();
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const tableProxy = useMemo(() => {
    if (runtime.wasmSchema === null) {
      return null;
    }

    return createTableProxy(tableName, runtime.wasmSchema);
  }, [runtime.wasmSchema, tableName]);

  /**
   * Waits for edge acknowledgement before treating a mutation as successful.
   *
   * Without the wait, the local mutation call could return before a remote permission or storage
   * failure is known. Errors are stored for shared UI and rethrown so the active form keeps its
   * draft and presents the same failure beside its controls.
   */
  const runMutation = async (callback: () => Promise<void>) => {
    try {
      setPendingCount((currentPendingCount) => currentPendingCount + 1);
      setError(null);
      await callback();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      throw nextError;
    } finally {
      setPendingCount((currentPendingCount) => Math.max(0, currentPendingCount - 1));
    }
  };

  return {
    error,
    isPending: pendingCount > 0,
    insertRow: async (values) => {
      if (tableProxy === null) {
        throw new Error("Schema is not loaded.");
      }

      await runMutation(async () => {
        await db.insert(tableProxy, omitUndefinedValues(values)).wait({ tier: "edge" });
      });
    },
    updateRow: async (rowId, values) => {
      if (tableProxy === null) {
        throw new Error("Schema is not loaded.");
      }

      await runMutation(async () => {
        await db.update(tableProxy, rowId, omitUndefinedValues(values)).wait({ tier: "edge" });
      });
    },
    deleteRow: async (rowId) => {
      if (tableProxy === null) {
        throw new Error("Schema is not loaded.");
      }

      await runMutation(async () => {
        await db.delete(tableProxy, rowId).wait({ tier: "edge" });
      });
    },
  };
}
