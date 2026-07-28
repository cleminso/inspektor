import { renderHook } from "@testing-library/react";
import type { DynamicTableRow } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRelationRow } from "@/hooks/useRelationRow";

const queryState = vi.hoisted(() => ({ rows: undefined as DynamicTableRow[] | undefined }));

vi.mock("jazz-tools/react", () => ({
  useAll: () => queryState.rows,
}));

vi.mock("@/components/providers/inspectorProvider", () => ({
  useInspector: () => ({ runtime: { wasmSchema: {} } }),
}));

vi.mock("@/lib/table-explorer/genericQueryBuilder", () => ({
  GenericQueryBuilder: class {
    where() {
      return this;
    }
    limit() {
      return this;
    }
  },
}));

vi.mock("@/lib/table-explorer/tableSchema", () => ({
  getRelationDisplayColumn: () => ({ name: "name" }),
}));

beforeEach(() => {
  queryState.rows = undefined;
});

describe("useRelationRow", () => {
  it("distinguishes pending, resolved, and missing query results", () => {
    const { result, rerender } = renderHook(() => useRelationRow("accounts", "account-1"));
    expect(result.current).toEqual({ status: "pending" });

    queryState.rows = [{ id: "account-1", name: "Ada" } as DynamicTableRow];
    rerender();
    expect(result.current).toEqual({ status: "resolved", displayValue: "Ada" });

    queryState.rows = [];
    rerender();
    expect(result.current).toEqual({ status: "missing" });
  });
});
