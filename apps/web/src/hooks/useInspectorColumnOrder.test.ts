// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { normalizeColumnOrder, useInspectorColumnOrder } from "@/hooks/useInspectorColumnOrder";

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    } satisfies Storage,
  });
});

describe("normalizeColumnOrder", () => {
  it("keeps known stored columns once and appends newly discovered columns", () => {
    expect(
      normalizeColumnOrder(["role", "missing", "name", "role"], ["name", "role", "createdAt"]),
    ).toEqual(["role", "name", "createdAt"]);
  });
});

describe("useInspectorColumnOrder", () => {
  it("exposes persisted order without a default-order render", () => {
    window.localStorage.setItem(
      "inspector:column-order:connection:accounts",
      JSON.stringify(["role", "id"]),
    );
    const renderedOrders: string[][] = [];

    renderHook(() => {
      const result = useInspectorColumnOrder({
        columnIds: ["id", "role"],
        tableKey: "connection:accounts",
      });
      renderedOrders.push(result.columnOrder);
      return result;
    });

    expect(renderedOrders[0]).toEqual(["role", "id"]);
  });
});
