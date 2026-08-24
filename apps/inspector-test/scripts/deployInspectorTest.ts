import { spawnSync } from "node:child_process";

function getRequiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing ${name}. Add it to apps/inspector-test/.env.local.`);
  }
  return value;
}

const result = spawnSync(
  "jazz-tools",
  [
    "deploy",
    getRequiredEnvironmentValue("VITE_JAZZ_APP_ID"),
    "--server-url",
    getRequiredEnvironmentValue("VITE_JAZZ_SERVER_URL"),
    "--admin-secret",
    getRequiredEnvironmentValue("JAZZ_ADMIN_SECRET"),
  ],
  { stdio: "inherit" },
);

if (result.error !== undefined) {
  throw result.error;
}
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
}
