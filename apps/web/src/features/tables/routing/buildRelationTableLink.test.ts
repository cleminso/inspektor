import { describe, expect, it } from "vitest";

import { buildRelationTableLink } from "@tables/routing/buildRelationTableLink";

describe("buildRelationTableLink", () => {
  it("builds a clean connection-scoped route to the target table", () => {
    const link = buildRelationTableLink({
      connectionId: "connection-1",
      tableName: "users",
    });

    expect(link.to).toBe("/conn/$connectionId/tables/$tableName");
    expect(link.params).toEqual({
      connectionId: "connection-1",
      tableName: "users",
    });
    expect(link.search).toEqual({});
  });
});
