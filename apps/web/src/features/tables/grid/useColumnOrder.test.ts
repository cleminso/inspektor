// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  moveColumnInOrder,
  normalizeColumnOrder,
  useColumnOrder,
} from "@tables/grid/useColumnOrder";

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

describe("moveColumnInOrder", () => {
  it("moves one column relatively or to an order boundary", () => {
    const order = ["id", "name", "role"];

    expect(moveColumnInOrder(order, "name", "left")).toEqual(["name", "id", "role"]);
    expect(moveColumnInOrder(order, "name", "right")).toEqual(["id", "role", "name"]);
    expect(moveColumnInOrder(order, "name", "start")).toEqual(["name", "id", "role"]);
    expect(moveColumnInOrder(order, "name", "end")).toEqual(["id", "role", "name"]);
  });

  it("moves relative to visible columns without disturbing hidden column positions", () => {
    const order = ["id", "hidden", "name", "role"];
    const visibleOrder = ["id", "name", "role"];

    expect(moveColumnInOrder(order, "id", "right", visibleOrder)).toEqual([
      "hidden",
      "name",
      "id",
      "role",
    ]);
    expect(moveColumnInOrder(order, "role", "start", visibleOrder)).toEqual([
      "role",
      "id",
      "hidden",
      "name",
    ]);
  });
});

describe("useColumnOrder", () => {
  it("restores and persists schema order when TanStack resets to an empty order", () => {
    const { result } = renderHook(() =>
      useColumnOrder({
        columnIds: ["id", "name", "role"],
        tableKey: "connection:accounts",
      }),
    );

    act(() => {
      result.current.setColumnOrder(["role", "id", "name"]);
      result.current.setColumnOrder([]);
    });

    expect(result.current.columnOrder).toEqual(["id", "name", "role"]);
    expect(window.localStorage.getItem("inspector:column-order:connection:accounts")).toBe(
      JSON.stringify(["id", "name", "role"]),
    );
  });

  it("exposes persisted order without a default-order render", () => {
    window.localStorage.setItem(
      "inspector:column-order:connection:accounts",
      JSON.stringify(["role", "id"]),
    );
    const renderedOrders: string[][] = [];

    renderHook(() => {
      const result = useColumnOrder({
        columnIds: ["id", "role"],
        tableKey: "connection:accounts",
      });
      renderedOrders.push(result.columnOrder);
      return result;
    });

    expect(renderedOrders[0]).toEqual(["role", "id"]);
  });

  it("falls back to schema order when storage cannot be read", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      },
    });

    const { result } = renderHook(() =>
      useColumnOrder({
        columnIds: ["id", "role"],
        tableKey: "connection:accounts",
      }),
    );

    expect(result.current.columnOrder).toEqual(["id", "role"]);
  });

  it("keeps order changes when storage cannot be written", () => {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      value: () => {
        throw new Error("Storage unavailable");
      },
    });
    const { result } = renderHook(() =>
      useColumnOrder({
        columnIds: ["id", "role"],
        tableKey: "connection:accounts",
      }),
    );

    act(() => {
      result.current.setColumnOrder(["role", "id"]);
    });

    expect(result.current.columnOrder).toEqual(["role", "id"]);
  });

  it("composes functional order updates before React renders", () => {
    const { result } = renderHook(() =>
      useColumnOrder({
        columnIds: ["id", "name", "role"],
        tableKey: "connection:accounts",
      }),
    );

    act(() => {
      result.current.setColumnOrder((current) => [current[1]!, current[0]!, current[2]!]);
      result.current.setColumnOrder((current) => [current[0]!, current[2]!, current[1]!]);
    });

    expect(result.current.columnOrder).toEqual(["name", "role", "id"]);
    expect(window.localStorage.getItem("inspector:column-order:connection:accounts")).toBe(
      JSON.stringify(["name", "role", "id"]),
    );
  });
});
