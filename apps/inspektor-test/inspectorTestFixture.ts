import { deploy, startLocalJazzServer } from "jazz-tools/testing";

import permissions from "./permissions.js";
import { app } from "./schema.js";
import { seedInspectorTest } from "./seedInspectorTest.js";

export interface InspectorTestFixture {
  adminSecret: string;
  appId: string;
  backendSecret: string;
  serverUrl: string;
  stop: () => Promise<void>;
}

export async function createInspectorTestFixture(): Promise<InspectorTestFixture> {
  const server = await startLocalJazzServer({ inMemory: true });

  try {
    await deploy({
      adminSecret: server.adminSecret,
      appId: server.appId,
      permissions,
      schema: app,
      serverUrl: server.url,
    });
    await seedInspectorTest({
      appId: server.appId,
      backendSecret: server.backendSecret,
      serverUrl: server.url,
    });
  } catch (error) {
    await server.stop();
    throw error;
  }

  return {
    adminSecret: server.adminSecret,
    appId: server.appId,
    backendSecret: server.backendSecret,
    serverUrl: server.url,
    stop: server.stop,
  };
}
