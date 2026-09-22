import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { schema as s, type QueryBuilder } from "jazz-tools";
import { createInspectorAdminClient } from "jazz-tools/_dev/inspector-client";
import { deploy, startLocalJazzServer } from "jazz-tools/testing";
import { describe, expect, it } from "vitest";

const app = s.defineApp({
  records: s.table(
    {
      label: s.string(),
    },
    {},
  ),
});

const permissions = s.definePermissions(app, ({ policy }) => {
  policy.records.allowRead.always();
  policy.records.allowInsert.always();
  policy.records.allowUpdate.always();
  policy.records.allowDelete.always();
});

async function createFixture(labels: readonly string[]) {
  const server = await startLocalJazzServer({ inMemory: true });
  try {
    await deploy({
      adminSecret: server.adminSecret,
      appId: server.appId,
      permissions,
      schema: app,
      serverUrl: server.url,
    });

    if (labels.length > 0) {
      const seedClient = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      try {
        for (const [index, label] of labels.entries()) {
          const id = `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
          await seedClient.db.insert(app.records, { label }, { id }).wait({ tier: "global" });
        }
      } finally {
        await seedClient.shutdown();
      }
    }

    return server;
  } catch (error) {
    await server.stop();
    throw error;
  }
}

async function readFirstSubscriptionSnapshot(
  client: Awaited<ReturnType<typeof createInspectorAdminClient>>,
  tier: "local-first" | "remote",
  query: QueryBuilder<s.RowOf<typeof app.records>> = app.records,
) {
  let unsubscribe: () => void = () => undefined;
  const firstSnapshot = new Promise<s.RowOf<typeof app.records>[]>((resolve, reject) => {
    unsubscribe = client.db.subscribe(
      query,
      {
        onUpdate: resolve,
        onError: reject,
      },
      { tier },
    );
  });
  try {
    return await firstSnapshot;
  } finally {
    unsubscribe();
  }
}

describe("alpha.56 subscription openings", () => {
  it("opens a populated remote subscription with the authoritative rows", async () => {
    const server = await createFixture(["Remote record"]);
    let client: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;

    try {
      client = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      await expect(readFirstSubscriptionSnapshot(client, "remote")).resolves.toEqual([
        expect.objectContaining({ label: "Remote record" }),
      ]);
    } finally {
      await client?.shutdown();
      await server.stop();
    }
  });

  it.fails("opens a sorted page only after the authoritative rows are available", async () => {
    const server = await createFixture(["Charlie", "Alpha", "Bravo"]);
    let client: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;

    try {
      client = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      const query = app.records.orderBy("label", "asc").orderBy("id", "asc").limit(2).offset(1);

      await expect(readFirstSubscriptionSnapshot(client, "remote", query)).resolves.toEqual([
        expect.objectContaining({ label: "Bravo" }),
        expect.objectContaining({ label: "Charlie" }),
      ]);
    } finally {
      await client?.shutdown();
      await server.stop();
    }
  });

  it("confirms an authoritative empty remote subscription", async () => {
    const server = await createFixture([]);
    let client: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;
    let unsubscribe: () => void = () => undefined;

    try {
      const activeClient = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      client = activeClient;
      const populatedSnapshot = new Promise<s.RowOf<typeof app.records>[]>((resolve, reject) => {
        let receivedOpening = false;
        unsubscribe = activeClient.db.subscribe(
          app.records,
          {
            onUpdate: (rows) => {
              if (receivedOpening === false) {
                receivedOpening = true;
                try {
                  expect(rows).toEqual([]);
                } catch (error) {
                  reject(error);
                  return;
                }
                void activeClient.db
                  .insert(app.records, { label: "Inserted after empty opening" })
                  .wait({ tier: "edge" })
                  .catch(reject);
                return;
              }
              resolve(rows);
            },
            onError: reject,
          },
          { tier: "remote" },
        );
      });

      await expect(populatedSnapshot).resolves.toEqual([
        expect.objectContaining({ label: "Inserted after empty opening" }),
      ]);
    } finally {
      unsubscribe();
      await client?.shutdown();
      await server.stop();
    }
  });

  it("preserves the immediate local opening for a fresh memory client", async () => {
    const server = await createFixture(["Remote record"]);
    let client: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;

    try {
      client = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      await expect(readFirstSubscriptionSnapshot(client, "local-first")).resolves.toEqual([]);
    } finally {
      await client?.shutdown();
      await server.stop();
    }
  });

  it("maintains remote updates through final-row deletion and client replacement", async () => {
    const server = await createFixture([]);
    let client: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;
    let writer: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;
    let unsubscribe: () => void = () => undefined;

    try {
      const activeClient = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      client = activeClient;
      const mutationClient = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      writer = mutationClient;
      const inserted = await mutationClient.db
        .insert(app.records, { label: "Initial label" })
        .wait({ tier: "edge" });

      const finalSnapshot = new Promise<s.RowOf<typeof app.records>[]>((resolve, reject) => {
        let phase: "opening" | "updated" | "deleted" = "opening";
        unsubscribe = activeClient.db.subscribe(
          app.records,
          {
            onUpdate: (rows) => {
              if (phase === "opening") {
                try {
                  expect(rows).toEqual([expect.objectContaining({ label: "Initial label" })]);
                } catch (error) {
                  reject(error);
                  return;
                }
                phase = "updated";
                void mutationClient.db
                  .update(app.records, inserted.id, { label: "Updated label" })
                  .wait({ tier: "edge" })
                  .catch(reject);
                return;
              }

              if (phase === "updated") {
                try {
                  expect(rows).toEqual([expect.objectContaining({ label: "Updated label" })]);
                } catch (error) {
                  reject(error);
                  return;
                }
                phase = "deleted";
                void mutationClient.db
                  .delete(app.records, inserted.id)
                  .wait({ tier: "edge" })
                  .catch(reject);
                return;
              }

              resolve(rows);
            },
            onError: reject,
          },
          { tier: "remote" },
        );
      });

      await expect(finalSnapshot).resolves.toEqual([]);
      unsubscribe();
      await activeClient.shutdown();
      client = undefined;
      await mutationClient.db
        .insert(app.records, { label: "Replacement opening" })
        .wait({ tier: "edge" });

      const replacementClient = await createInspectorAdminClient({
        adminSecret: server.adminSecret,
        appId: server.appId,
        serverUrl: server.url,
      });
      client = replacementClient;
      await expect(readFirstSubscriptionSnapshot(replacementClient, "remote")).resolves.toEqual([
        expect.objectContaining({ label: "Replacement opening" }),
      ]);
    } finally {
      unsubscribe();
      await writer?.shutdown();
      await client?.shutdown();
      await server.stop();
    }
  });

  it("resumes a remote subscription after the local server restarts", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "inspektor-jazz-reconnect-"));
    let server: Awaited<ReturnType<typeof startLocalJazzServer>> | undefined;
    let client: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;
    let writer: Awaited<ReturnType<typeof createInspectorAdminClient>> | undefined;
    let unsubscribe: () => void = () => undefined;
    let restart: Promise<void> | undefined;

    try {
      const initialServer = await startLocalJazzServer({ dataDir });
      server = initialServer;
      await deploy({
        adminSecret: initialServer.adminSecret,
        appId: initialServer.appId,
        permissions,
        schema: app,
        serverUrl: initialServer.url,
      });
      const activeClient = await createInspectorAdminClient({
        adminSecret: initialServer.adminSecret,
        appId: initialServer.appId,
        serverUrl: initialServer.url,
      });
      client = activeClient;

      const reconnectedSnapshot = new Promise<s.RowOf<typeof app.records>[]>((resolve, reject) => {
        let receivedOpening = false;
        unsubscribe = activeClient.db.subscribe(
          app.records,
          {
            onUpdate: (rows) => {
              if (receivedOpening === false) {
                receivedOpening = true;
                const restartOptions = {
                  adminSecret: initialServer.adminSecret,
                  appId: initialServer.appId,
                  backendSecret: initialServer.backendSecret,
                  port: initialServer.port,
                };
                restart = (async () => {
                  await initialServer.stop();
                  const restartedServer = await startLocalJazzServer({
                    ...restartOptions,
                    dataDir,
                  });
                  server = restartedServer;
                  writer = await createInspectorAdminClient({
                    adminSecret: restartedServer.adminSecret,
                    appId: restartedServer.appId,
                    serverUrl: restartedServer.url,
                  });
                  await writer.db
                    .insert(app.records, { label: "After reconnect" })
                    .wait({ tier: "edge" });
                })();
                void restart.catch(reject);
                return;
              }
              resolve(rows);
            },
            onError: reject,
          },
          { tier: "remote" },
        );
      });

      await expect(reconnectedSnapshot).resolves.toEqual([
        expect.objectContaining({ label: "After reconnect" }),
      ]);
    } finally {
      await restart?.catch(() => undefined);
      unsubscribe();
      await writer?.shutdown();
      await client?.shutdown();
      await server?.stop();
      await rm(dataDir, { force: true, recursive: true });
    }
  });
});
