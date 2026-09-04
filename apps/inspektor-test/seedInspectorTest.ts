import { createJazzContext } from "jazz-tools/backend";
import type { WriteHandle } from "jazz-tools";

import { inspectorTestRows } from "./inspectorTestData.js";
import permissions from "./permissions.js";
import { app } from "./schema.js";

export interface InspectorTestConnection {
  appId: string;
  backendSecret: string;
  serverUrl: string;
}

async function waitForWrites(writes: WriteHandle[]): Promise<void> {
  for (const write of writes) {
    await write.wait({ tier: "global" });
  }
}

export async function seedInspectorTest(connection: InspectorTestConnection): Promise<void> {
  const context = createJazzContext({
    app,
    permissions,
    appId: connection.appId,
    backendSecret: connection.backendSecret,
    driver: { type: "memory" },
    env: "dev",
    serverUrl: connection.serverUrl,
    userBranch: "main",
  });

  try {
    const db = context.asBackend();
    const writes: WriteHandle[] = [];

    for (const { id, ...values } of inspectorTestRows.projects) {
      writes.push(db.upsert(app.projects, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.relationParents) {
      writes.push(db.upsert(app.relationParents, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.columnTypeShowcase) {
      writes.push(db.upsert(app.columnTypeShowcase, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.contentEdgeCases) {
      writes.push(db.upsert(app.contentEdgeCases, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.creatorManagedRecords) {
      writes.push(db.upsert(app.creatorManagedRecords, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.paginationRecords) {
      writes.push(db.upsert(app.paginationRecords, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.publicEditableRecords) {
      writes.push(db.upsert(app.publicEditableRecords, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.publicReadOnlyRecords) {
      writes.push(db.upsert(app.publicReadOnlyRecords, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.relationChildren) {
      writes.push(db.upsert(app.relationChildren, values, { id }));
    }
    for (const { id, ...values } of inspectorTestRows.wideRecords) {
      writes.push(db.upsert(app.wideRecords, values, { id }));
    }

    await waitForWrites(writes);
  } finally {
    await context.shutdown();
  }
}
