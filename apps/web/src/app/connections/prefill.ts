/**
 * Extracts Inspektor connection drafts from dev-tool links.
 *
 * Jazz dev tooling can open the Inspektor with connection details embedded in the
 * URL. This module turns those values into the same draft shape used by the
 * connection form, so the Inspektor can attach to a Jazz app without manual entry.
 */
import {
  DEFAULT_BRANCH_NAME,
  DEFAULT_SERVER_URL,
  normalizeBranchName,
  normalizeEnvName,
  type ConnectionDraft,
} from './connections'

/** URL-provided connection draft plus the Jazz branch selected for the Inspektor runtime. */
export interface PrefillConfig extends ConnectionDraft {
  branch: string
}

/**
 * Parses known Inspektor prefill params from query string and URL fragment.
 *
 * Fragment params keep `adminSecret` out of the HTTP request for the Inspektor
 * page. Query params remain supported for compatibility and manual links.
 */
export function readPrefillConfig(locationOverride?: Location): PrefillConfig | null {
  const location = locationOverride ?? globalThis.location
  if (!location) {
    return null
  }

  const searchParams = new URLSearchParams(location.search)
  const hashValue = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
  const hashParams = new URLSearchParams(hashValue)
  const mergedParams = mergeSearchParams(searchParams, hashParams)
  const hasKnownPrefillParam = ['name', 'serverUrl', 'appId', 'adminSecret', 'env', 'branch'].some(
    (key) => mergedParams.has(key),
  )

  if (!hasKnownPrefillParam) {
    return null
  }

  return {
    name: (mergedParams.get('name') ?? '').trim(),
    serverUrl: (mergedParams.get('serverUrl') ?? DEFAULT_SERVER_URL).trim() || DEFAULT_SERVER_URL,
    appId: (mergedParams.get('appId') ?? '').trim(),
    adminSecret: (mergedParams.get('adminSecret') ?? '').trim(),
    env: normalizeEnvName(mergedParams.get('env')),
    branch: normalizeBranchName(mergedParams.get('branch') ?? DEFAULT_BRANCH_NAME),
  }
}

/** Keeps explicit query values while filling missing fields from the fragment. */
function mergeSearchParams(
  searchParams: URLSearchParams,
  hashParams: URLSearchParams,
): URLSearchParams {
  const mergedParams = new URLSearchParams(searchParams)

  for (const [key, value] of hashParams.entries()) {
    if (!mergedParams.has(key)) {
      mergedParams.set(key, value)
    }
  }

  return mergedParams
}
