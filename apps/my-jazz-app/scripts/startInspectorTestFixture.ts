import { createInspectorTestFixture } from "../inspectorTestFixture.js";

const fixture = await createInspectorTestFixture();

console.log("Inspector Test fixture is ready.");
console.log(
  JSON.stringify({
    adminSecret: fixture.adminSecret,
    appId: fixture.appId,
    connectionName: "Inspector Test fixture",
    env: "dev",
    branch: "main",
    serverUrl: fixture.serverUrl,
  }),
);
console.log("Press Ctrl+C to stop the fixture.");

let stopping = false;

async function stopFixture(): Promise<void> {
  if (stopping === true) {
    return;
  }
  stopping = true;
  await fixture.stop();
}

process.once("SIGINT", () => {
  void stopFixture();
});
process.once("SIGTERM", () => {
  void stopFixture();
});
