import { describe, expect, it } from "vitest";

import type { QuerySubscriptionRow } from "@/types/querySubscriptions";

import {
  filterQuerySubscriptionRows,
  filterQuerySubscriptionTableNames,
} from "./querySubscriptionFilters";

const rows: QuerySubscriptionRow[] = [
  {
    branches: ["main"],
    count: 2,
    groupKey: "accounts-full",
    propagation: "full",
    query: "accounts query",
    table: "accounts",
  },
  {
    branches: ["main"],
    count: 1,
    groupKey: "accounts-local",
    propagation: "local-only",
    query: "local accounts query",
    table: "accounts",
  },
  {
    branches: ["main"],
    count: 3,
    groupKey: "rooms-full",
    propagation: "full",
    query: "rooms query",
    table: "rooms",
  },
];

describe("filterQuerySubscriptionTableNames", () => {
  it("filters schema tables without depending on active telemetry", () => {
    expect(
      filterQuerySubscriptionTableNames(["accounts", "archived_accounts", "rooms"], "ARCHIVED"),
    ).toEqual(["archived_accounts"]);
  });
});

describe("filterQuerySubscriptionRows", () => {
  it("does not filter propagation when no propagation option is selected", () => {
    expect(
      filterQuerySubscriptionRows(rows, {
        selectedPropagations: [],
        selectedTableName: "accounts",
      }),
    ).toEqual([rows[0], rows[1]]);
  });

  it("combines table and propagation filters", () => {
    expect(
      filterQuerySubscriptionRows(rows, {
        selectedPropagations: ["full"],
        selectedTableName: "accounts",
      }),
    ).toEqual([rows[0]]);
  });
});
