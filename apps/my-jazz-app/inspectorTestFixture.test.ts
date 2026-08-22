import { createJazzContext } from "jazz-tools/backend";
import { describe, expect, it } from "vitest";

import { inspectorTestIds, inspectorTestRows } from "./inspectorTestData.js";
import permissions from "./permissions.js";
import { createInspectorTestFixture } from "./inspectorTestFixture.js";
import { app } from "./schema.js";
import { seedInspectorTest } from "./seedInspectorTest.js";

describe("createInspectorTestFixture", () => {
  it("publishes and seeds an isolated Inspector Test app", async () => {
    const fixture = await createInspectorTestFixture();
    const context = createJazzContext({
      app,
      permissions,
      appId: fixture.appId,
      backendSecret: fixture.backendSecret,
      driver: { type: "memory" },
      env: "dev",
      serverUrl: fixture.serverUrl,
      userBranch: "main",
    });

    try {
      const db = context.asBackend();
      const columnTypeRows = await db.all(app.columnTypeShowcase, { tier: "global" });
      const contentRows = await db.all(app.contentEdgeCases, { tier: "global" });
      const relationRows = await db.all(app.relationChildren, { tier: "global" });
      const wideRecords = await db.all(app.wideRecords, { tier: "global" });
      const populatedColumnValues = inspectorTestRows.columnTypeShowcase[0];
      const nullColumnValues = inspectorTestRows.columnTypeShowcase[1];
      const populatedColumnRow = columnTypeRows.find((row) => row.id === populatedColumnValues?.id);
      const nullColumnRow = columnTypeRows.find((row) => row.id === nullColumnValues?.id);
      const populatedRelationValues = inspectorTestRows.relationChildren[0];
      const nullRelationValues = inspectorTestRows.relationChildren[1];
      const populatedRelationRow = relationRows.find((row) => row.id === populatedRelationValues?.id);
      const nullRelationRow = relationRows.find((row) => row.id === nullRelationValues?.id);

      expect(columnTypeRows).toHaveLength(2);
      expect(populatedColumnRow?.timestampValue).toEqual(populatedColumnValues?.timestampValue);
      expect(populatedColumnRow?.bytesValue).toEqual(populatedColumnValues?.bytesValue);
      expect(nullColumnRow?.optionalTextValue).toBeNull();
      expect(contentRows[0]?.jsonValue).toEqual(inspectorTestRows.contentEdgeCases[0]?.jsonValue);
      expect(contentRows[0]?.unicodeText).toBe(inspectorTestRows.contentEdgeCases[0]?.unicodeText);
      expect(populatedRelationRow?.requiredParentId).toBe(inspectorTestIds.relationParentPrimary);
      expect(populatedRelationRow?.optionalParentId).toBe(inspectorTestIds.relationParentSecondary);
      expect(nullRelationRow?.optionalParentId).toBeNull();
      expect(wideRecords).toHaveLength(2);
      expect(fixture.serverUrl).toMatch(/^http:\/\/127\.0\.0\.1:/);
    } finally {
      await context.shutdown();
      await fixture.stop();
    }
  });

  it("keeps deterministic row counts when seeded repeatedly", async () => {
    const fixture = await createInspectorTestFixture();
    const context = createJazzContext({
      app,
      permissions,
      appId: fixture.appId,
      backendSecret: fixture.backendSecret,
      driver: { type: "memory" },
      env: "dev",
      serverUrl: fixture.serverUrl,
      userBranch: "main",
    });

    try {
      await seedInspectorTest(fixture);

      const db = context.asBackend();
      const projects = await db.all(app.projects, { tier: "global" });
      const relationParents = await db.all(app.relationParents, { tier: "global" });
      const wideRecords = await db.all(app.wideRecords, { tier: "global" });

      expect(projects).toHaveLength(inspectorTestRows.projects.length);
      expect(relationParents).toHaveLength(inspectorTestRows.relationParents.length);
      expect(wideRecords).toHaveLength(inspectorTestRows.wideRecords.length);
      expect(projects[0]?.id).toBe(inspectorTestIds.project);
    } finally {
      await context.shutdown();
      await fixture.stop();
    }
  });

  it("stops the local server and discards its in-memory app", async () => {
    const fixture = await createInspectorTestFixture();

    await fixture.stop();

    await expect(fetch(fixture.serverUrl)).rejects.toThrow();
  });
});
