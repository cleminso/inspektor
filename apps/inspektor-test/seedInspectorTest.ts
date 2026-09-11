import {
  createJazzSession,
  type Db,
  type QueryBuilder,
  type TableProxy,
} from "jazz-tools/backend";
import { inspectorTestRows } from "./inspectorTestData.js";
import { app } from "./schema.js";

export interface InspectorTestConnection {
  appId: string;
  backendSecret: string;
  serverUrl: string;
}

interface PendingWrite {
  wait(options: { tier: "global" }): Promise<unknown>;
}

/** Waits for global durability before the memory-backed seeding session closes. */
async function waitForWrites(writes: PendingWrite[]): Promise<void> {
  for (const write of writes) {
    await write.wait({ tier: "global" });
  }
}

async function seedRows<Row extends { id: string }, Init>(
  db: Db,
  table: QueryBuilder<Row> & TableProxy<Row, Init>,
  rows: readonly Row[],
  valuesFor: (row: Row) => Init,
  writes: PendingWrite[],
): Promise<void> {
  const existingIds = new Set((await db.all(table, { tier: "global" })).map((row) => row.id));
  for (const row of rows) {
    const values = valuesFor(row);
    writes.push(
      existingIds.has(row.id)
        ? db.update(table, row.id, values)
        : db.insert(table, values, { id: row.id }),
    );
  }
}

export async function seedInspectorTest(connection: InspectorTestConnection): Promise<void> {
  const session = await createJazzSession({
    app,
    appId: connection.appId,
    driver: { type: "memory" },
    env: "dev",
    initial: { backendSecret: connection.backendSecret },
    serverUrl: connection.serverUrl,
  });

  try {
    const snapshot = session.getSnapshot();
    if (snapshot.status !== "ready" || snapshot.client === undefined) {
      throw new Error("Inspektor Test backend session is not ready.");
    }
    const db = snapshot.client.db;
    const writes: PendingWrite[] = [];

    await seedRows(db, app.projects, inspectorTestRows.projects, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.relationParents, inspectorTestRows.relationParents, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.columnTypeShowcase, inspectorTestRows.columnTypeShowcase, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.contentEdgeCases, inspectorTestRows.contentEdgeCases, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.creatorManagedRecords, inspectorTestRows.creatorManagedRecords, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.paginationRecords, inspectorTestRows.paginationRecords, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.publicEditableRecords, inspectorTestRows.publicEditableRecords, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.publicReadOnlyRecords, inspectorTestRows.publicReadOnlyRecords, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.relationChildren, inspectorTestRows.relationChildren, ({ id: _id, ...values }) => values, writes);
    await seedRows(db, app.wideRecords, inspectorTestRows.wideRecords, ({ id: _id, ...values }) => values, writes);

    await waitForWrites(writes);
  } finally {
    await session.close();
  }
}
