import { getCredentialSafeRelativeUrl } from '@app/routing/credentialSafeUrl'

const AUTOMATIC_RECOVERY_STORAGE_KEY = 'inspektor-automatic-connection-recovery'
let reloadRequested = false

export function beginAutomaticConnectionRecovery(): boolean {
  try {
    const location = getCredentialSafeRelativeUrl(window.location)
    if (sessionStorage.getItem(AUTOMATIC_RECOVERY_STORAGE_KEY) === location) return false

    sessionStorage.setItem(AUTOMATIC_RECOVERY_STORAGE_KEY, location)
    return true
  } catch {
    return false
  }
}

export function clearAutomaticConnectionRecovery(): void {
  if (reloadRequested === true) return

  try {
    sessionStorage.removeItem(AUTOMATIC_RECOVERY_STORAGE_KEY)
  } catch {
    // Storage may be unavailable. Recovery remains bounded because claiming it also fails closed.
  }
}

export function reloadConnectionPage(): void {
  reloadRequested = true
  window.location.reload()
}
