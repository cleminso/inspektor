import { createPolicyTestApp, type PolicyTestApp } from "jazz-tools/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import permissions from "./permissions.js";
import { app } from "./schema.js";

const aliceSession = {
  issuer: "https://inspektor.test",
  user_id: "alice",
  account_id: "10000000-0000-4000-8000-000000000001",
  claims: {},
  authMode: "external" as const,
};

const bobSession = {
  issuer: "https://inspektor.test",
  user_id: "bob",
  account_id: "10000000-0000-4000-8000-000000000002",
  claims: {},
  authMode: "external" as const,
};

describe("Inspektor Test permissions", () => {
  let testApp: PolicyTestApp | undefined;

  function getTestApp(): PolicyTestApp {
    if (testApp === undefined) {
      throw new Error("Inspektor Test policy app is not ready.");
    }
    return testApp;
  }

  beforeEach(async () => {
    testApp = await createPolicyTestApp(app, permissions, expect);
  });

  afterEach(async () => {
    await testApp?.shutdown();
    testApp = undefined;
  });

  it("allows public mutations", async () => {
    const alice = getTestApp().as(aliceSession);
    const inserted = await alice
      .insert(app.publicEditableRecords, {
        label: "Public record",
        enabled: true,
      })
      .wait({ tier: "edge" });

    await alice
      .update(app.publicEditableRecords, inserted.id, { enabled: false })
      .wait({ tier: "edge" });
    await expect(
      alice.all(app.publicEditableRecords.where({ id: inserted.id })),
    ).resolves.toEqual([
      expect.objectContaining({
        id: inserted.id,
        enabled: false,
      }),
    ]);
    await alice.delete(app.publicEditableRecords, inserted.id).wait({ tier: "edge" });
  });

  it("allows reads and rejects mutations for public read-only records", async () => {
    const policyTestApp = getTestApp();
    const row = await policyTestApp.seed((db) =>
      db.insert(app.publicReadOnlyRecords, {
        label: "Read-only record",
        notes: null,
      }),
    );
    const alice = policyTestApp.as(aliceSession);

    await expect(
      alice.all(app.publicReadOnlyRecords.where({ id: row.id })),
    ).resolves.toEqual([expect.objectContaining({ id: row.id })]);
    await alice.expectDenied((db) =>
      db.update(app.publicReadOnlyRecords, row.id, { label: "Denied update" }),
    );
    await alice.expectDenied((db) => db.delete(app.publicReadOnlyRecords, row.id));
    await alice.expectDenied((db) =>
      db.insert(app.publicReadOnlyRecords, {
        label: "Denied insert",
        notes: null,
      }),
    );
  });

  it("limits creator-managed records to their creator", async () => {
    const policyTestApp = getTestApp();
    const alice = policyTestApp.as(aliceSession);
    const bob = policyTestApp.as(bobSession);
    const inserted = await alice
      .insert(app.creatorManagedRecords, {
        label: "Alice's record",
        notes: null,
      })
      .wait({ tier: "edge" });

    await expect(
      alice.all(app.creatorManagedRecords.where({ id: inserted.id })),
    ).resolves.toEqual([expect.objectContaining({ id: inserted.id })]);
    await expect(
      bob.all(app.creatorManagedRecords.where({ id: inserted.id })),
    ).resolves.toEqual([]);
    await alice
      .update(app.creatorManagedRecords, inserted.id, { label: "Alice's update" })
      .wait({ tier: "edge" });
    expect(() =>
      bob.update(app.creatorManagedRecords, inserted.id, { label: "Bob's update" }),
    ).toThrow(/read policy denied UPDATE on table creatorManagedRecords/);
    await bob.expectDenied((db) => db.delete(app.creatorManagedRecords, inserted.id));
    await alice.delete(app.creatorManagedRecords, inserted.id).wait({ tier: "edge" });
  });

  it("enforces old and new row conditions for todo updates and deletes", async () => {
    const policyTestApp = getTestApp();
    const incompleteTodo = await policyTestApp.seed((db) =>
      db.insert(app.todos, {
        title: "Incomplete todo",
        done: false,
        description: null,
        parentId: null,
        projectId: null,
      }),
    );
    const completedTodo = await policyTestApp.seed((db) =>
      db.insert(app.todos, {
        title: "Completed todo",
        done: true,
        description: null,
        parentId: null,
        projectId: null,
      }),
    );
    const alice = policyTestApp.as(aliceSession);

    await alice
      .update(app.todos, incompleteTodo.id, { title: "Allowed update" })
      .wait({ tier: "edge" });
    await alice.expectDenied((db) =>
      db.update(app.todos, incompleteTodo.id, { done: true }),
    );
    await alice.expectDenied((db) =>
      db.update(app.todos, completedTodo.id, { title: "Denied update" }),
    );
    await alice.expectDenied((db) => db.delete(app.todos, completedTodo.id));
    await alice.delete(app.todos, incompleteTodo.id).wait({ tier: "edge" });
  });
});
