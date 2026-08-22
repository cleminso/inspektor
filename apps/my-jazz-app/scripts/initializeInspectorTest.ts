import { deploy, pushSchema } from "jazz-tools/dev";

import permissions from "../permissions.js";
import { app } from "../schema.js";

function getRequiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing ${name}. Add it to apps/my-jazz-app/.env.local.`);
  }
  return value;
}

const connection = {
  adminSecret: getRequiredEnvironmentValue("JAZZ_ADMIN_SECRET"),
  appId: getRequiredEnvironmentValue("VITE_JAZZ_APP_ID"),
  serverUrl: getRequiredEnvironmentValue("VITE_JAZZ_SERVER_URL"),
};

await pushSchema({ ...connection, schema: app });
const result = await deploy({ ...connection, permissions, schema: app });

console.log(`Initialized Inspector Test with schema ${result.schema.hash}.`);
