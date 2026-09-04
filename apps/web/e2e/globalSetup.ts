import { createInspectorTestFixture } from '../../inspektor-test/inspectorTestFixture.js'

export default async function globalSetup(): Promise<() => Promise<void>> {
  const fixture = await createInspectorTestFixture()

  process.env.INSPECTOR_E2E_SERVER_URL = fixture.serverUrl
  process.env.INSPECTOR_E2E_APP_ID = fixture.appId
  process.env.INSPECTOR_E2E_ADMIN_SECRET = fixture.adminSecret
  process.env.INSPECTOR_E2E_BACKEND_SECRET = fixture.backendSecret

  return fixture.stop
}
