import { describe, expect, it } from "vitest";

import { inspectorTestRows } from "./inspectorTestData.js";

describe("Inspector Test data", () => {
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
});
