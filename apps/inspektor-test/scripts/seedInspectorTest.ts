import { seedInspectorTest } from "../seedInspectorTest.js";

function getRequiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing ${name}. Add it to apps/inspektor-test/.env.local.`);
  }
  return value;
}

await seedInspectorTest({
  appId: getRequiredEnvironmentValue("VITE_JAZZ_APP_ID"),
  backendSecret: getRequiredEnvironmentValue("BACKEND_SECRET"),
  serverUrl: getRequiredEnvironmentValue("VITE_JAZZ_SERVER_URL"),
});

console.log("Seeded Inspektor Test.");
