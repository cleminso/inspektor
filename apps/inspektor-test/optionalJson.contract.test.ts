import { schema as s } from "jazz-tools";
import { createJazzSession } from "jazz-tools/backend";
import { deploy, startLocalJazzServer } from "jazz-tools/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const app = s.defineApp({
  documents: s.table(
    {
      name: s.string(),
      requiredJson: s.json(),
      optionalJson: s.json().optional(),
    },
    {},
  ),
});

const permissions = s.definePermissions(app, ({ policy }) => {
  policy.documents.allowRead.always();
  policy.documents.allowInsert.always();
  policy.documents.allowUpdate.always();
});

const optionalJsonProtocolError =
  "Protocol: value does not match type Internal(InternalValueType(StoredScalar(Json)))";

async function createFixture() {
  const server = await startLocalJazzServer({ inMemory: true });
  let session: Awaited<ReturnType<typeof createJazzSession>> | undefined;

  try {
    await deploy({
      adminSecret: server.adminSecret,
      appId: server.appId,
      permissions,
      schema: app,
      serverUrl: server.url,
    });
    const activeSession = await createJazzSession({
      app,
      appId: server.appId,
      driver: { type: "memory" },
      env: "dev",
      initial: { backendSecret: server.backendSecret },
      permissions,
      serverUrl: server.url,
    });
    session = activeSession;
    const snapshot = activeSession.getSnapshot();
    if (snapshot.status !== "ready" || snapshot.client === undefined) {
      throw new Error("Optional JSON contract session is not ready.");
    }

    return {
      db: snapshot.client.db,
      stop: async () => {
        await activeSession.close();
        await server.stop();
      },
    };
  } catch (error) {
    await session?.close();
    await server.stop();
    throw error;
  }
}

describe("Jazz optional JSON write contract", () => {
  let fixture: Awaited<ReturnType<typeof createFixture>> | undefined;

  beforeEach(async () => {
    fixture = await createFixture();
  });

  afterEach(async () => {
    await fixture?.stop();
    fixture = undefined;
  });

  function getDb() {
    if (fixture === undefined) {
      throw new Error("Optional JSON contract fixture is not ready.");
    }
    return fixture.db;
  }

  it("round-trips required JSON without an optional value", async () => {
    const db = getDb();
    const row = await db
      .insert(app.documents, { name: "Required", requiredJson: { present: true } })
      .wait({ tier: "global" });

    await expect(db.all(app.documents.where({ id: row.id }), { tier: "global" })).resolves.toEqual([
      expect.objectContaining({ requiredJson: { present: true }, optionalJson: null }),
    ]);
  });

  it("round-trips an omitted optional JSON value", async () => {
    const db = getDb();
    const row = await db
      .insert(app.documents, { name: "Omitted", requiredJson: {} })
      .wait({ tier: "global" });

    await expect(db.all(app.documents.where({ id: row.id }), { tier: "global" })).resolves.toEqual([
      expect.objectContaining({ optionalJson: null }),
    ]);
  });

  it("identifies the protocol rejection for a populated optional JSON value", async () => {
    const db = getDb();
    await expect(async () => {
      await db
        .insert(app.documents, {
          name: "Populated",
          requiredJson: {},
          optionalJson: { present: true },
        })
        .wait({ tier: "global" });
    }).rejects.toMatchObject({ message: optionalJsonProtocolError });
  });

  it("identifies the protocol rejection for explicit SQL null", async () => {
    const db = getDb();
    await expect(async () => {
      await db
        .insert(app.documents, { name: "Null", requiredJson: {}, optionalJson: null })
        .wait({ tier: "global" });
    }).rejects.toMatchObject({ message: optionalJsonProtocolError });
  });

  it("identifies the protocol rejection for an update from omitted to SQL null", async () => {
    const db = getDb();
    const row = await db
      .insert(app.documents, { name: "Updated", requiredJson: {} })
      .wait({ tier: "global" });
    await expect(db.all(app.documents.where({ id: row.id }), { tier: "global" })).resolves.toEqual([
      expect.objectContaining({ optionalJson: null }),
    ]);
    await expect(async () => {
      await db.update(app.documents, row.id, { optionalJson: null }).wait({ tier: "global" });
    }).rejects.toMatchObject({ message: optionalJsonProtocolError });
  });
});
