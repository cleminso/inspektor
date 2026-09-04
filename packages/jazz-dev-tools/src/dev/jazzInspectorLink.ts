const LOCAL_INSPEKTOR_URL = "https://inspektor.localhost:1355/conn/new";

function encodeFragmentValue(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Builds a local Inspector link for the Jazz app managed by dev tooling.
 *
 * Connection values live in the URL fragment so `adminSecret` is available to the
 * Inspector page without being sent in the HTTP request.
 */
export function buildJazzInspectorLink(serverUrl: string, appId: string, adminSecret: string): string {
  return (
    `${LOCAL_INSPEKTOR_URL}#serverUrl=${encodeFragmentValue(serverUrl)}` +
    `&appId=${encodeFragmentValue(appId)}` +
    `&adminSecret=${encodeFragmentValue(adminSecret)}`
  );
}

export { LOCAL_INSPEKTOR_URL };
