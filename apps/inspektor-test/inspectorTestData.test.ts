import { describe, expect, it } from "vitest";

import { inspectorTestRows } from "./inspectorTestData.js";

describe("Inspektor Test data", () => {
  it("pairs populated and null optional values", () => {
    expect(inspectorTestRows.columnTypeShowcase).toHaveLength(2);
    expect(inspectorTestRows.columnTypeShowcase[0]?.optionalTextValue).toBeTruthy();
    expect(inspectorTestRows.columnTypeShowcase[1]?.optionalTextValue).toBeNull();
    expect(inspectorTestRows.wideRecords[0]?.optionalRelationParentId).toBeTruthy();
    expect(inspectorTestRows.wideRecords[1]?.optionalRelationParentId).toBeNull();
  });

  it("includes content that exercises text rendering boundaries", () => {
    const edgeCase = inspectorTestRows.contentEdgeCases[0];

    expect(edgeCase?.emptyText).toBe("");
    expect(edgeCase?.multilineText).toContain("\n");
    expect(edgeCase?.unicodeText).toContain("👩🏽‍💻");
    expect(edgeCase?.rightToLeftText).toContain("مرحبا");
    expect(edgeCase?.longText.length).toBeGreaterThan(1_000);
  });

  it("crosses the first pagination boundary with stable rows", () => {
    expect(inspectorTestRows.paginationRecords).toHaveLength(101);
    expect(inspectorTestRows.paginationRecords[0]).toEqual({
      id: "90000000-0000-4000-8000-000000000001",
      label: "Pagination row 001",
    });
    expect(inspectorTestRows.paginationRecords[100]).toEqual({
      id: "90000000-0000-4000-8000-000000000101",
      label: "Pagination row 101",
    });
  });
});
