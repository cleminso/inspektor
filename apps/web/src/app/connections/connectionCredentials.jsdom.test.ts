import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearConnectionCredential,
  resolveRuntimeConnection,
  saveConnectionCredential,
} from './connectionCredentials'
import type { StoredConnection } from './connections'

const memoryProfile: StoredConnection = {
  id: 'connection-1',
  name: 'Sensitive app',
  serverUrl: 'https://sync.example.com',
  appId: 'app-1',
  env: 'prod',
  credentialRetention: 'memory',
}

const sessionProfile: StoredConnection = {
  ...memoryProfile,
  credentialRetention: 'session',
}

beforeEach(() => {
  window.sessionStorage.clear()
  clearConnectionCredential(memoryProfile.id)
  clearConnectionCredential('connection-2')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('connection credentials', () => {
  it('keeps memory credentials out of session storage', () => {
    saveConnectionCredential(memoryProfile, 'memory-secret')

    expect(resolveRuntimeConnection(memoryProfile)?.adminSecret).toBe('memory-secret')
    expect(window.sessionStorage.getItem('inspektor-connection-credentials')).toBeNull()
  })

  it('restores opted-in credentials from the current tab session', async () => {
    saveConnectionCredential(sessionProfile, 'session-secret')

    vi.resetModules()
    const { resolveRuntimeConnection: resolveAfterReload } = await import('./connectionCredentials')

    expect(resolveAfterReload(sessionProfile)?.adminSecret).toBe('session-secret')
    expect(window.sessionStorage.getItem('inspektor-connection-credentials')).not.toContain(
      memoryProfile.name,
    )
  })

  it('does not attach a stored credential to a changed destination', async () => {
    saveConnectionCredential(sessionProfile, 'session-secret')

    vi.resetModules()
    const { resolveRuntimeConnection: resolveAfterReload } = await import('./connectionCredentials')

    expect(resolveAfterReload({ ...sessionProfile, appId: 'app-2' })).toBeNull()
  })

  it('removes a tab credential when retention changes to memory', () => {
    saveConnectionCredential(sessionProfile, 'session-secret')
    saveConnectionCredential(memoryProfile, 'memory-secret')

    expect(window.sessionStorage.getItem('inspektor-connection-credentials')).toBeNull()
    expect(resolveRuntimeConnection(memoryProfile)?.adminSecret).toBe('memory-secret')
  })

  it('fails closed when the browser blocks session storage access', () => {
    const sessionStorageGetter = vi
      .spyOn(window, 'sessionStorage', 'get')
      .mockImplementation(() => {
        throw new DOMException('Storage access is blocked', 'SecurityError')
      })

    expect(resolveRuntimeConnection(sessionProfile)).toBeNull()
    expect(() => saveConnectionCredential(sessionProfile, 'session-secret')).toThrow(
      'Session storage is unavailable',
    )

    sessionStorageGetter.mockRestore()
  })

  it('does not switch to memory retention when removing the tab credential fails', () => {
    saveConnectionCredential(sessionProfile, 'session-secret')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Storage access is blocked', 'SecurityError')
    })

    expect(() => saveConnectionCredential(memoryProfile, 'memory-secret')).toThrow()
    expect(window.sessionStorage.getItem('inspektor-connection-credentials')).toContain(
      'session-secret',
    )

    removeItem.mockRestore()
  })

  it('does not switch to memory retention when session storage access is blocked', () => {
    saveConnectionCredential(sessionProfile, 'session-secret')
    const sessionStorageGetter = vi
      .spyOn(window, 'sessionStorage', 'get')
      .mockImplementation(() => {
        throw new DOMException('Storage access is blocked', 'SecurityError')
      })

    expect(() => saveConnectionCredential(memoryProfile, 'memory-secret')).toThrow(
      'Session storage is unavailable',
    )

    sessionStorageGetter.mockRestore()
  })

  it('removes malformed session credential data during cleanup', () => {
    window.sessionStorage.setItem('inspektor-connection-credentials', '{malformed')

    clearConnectionCredential(sessionProfile.id)

    expect(window.sessionStorage.getItem('inspektor-connection-credentials')).toBeNull()
  })

  it('removes only the deleted connection from session storage', () => {
    const otherProfile = { ...sessionProfile, id: 'connection-2' }
    saveConnectionCredential(sessionProfile, 'session-secret')
    saveConnectionCredential(otherProfile, 'other-session-secret')

    clearConnectionCredential(sessionProfile.id)

    expect(window.sessionStorage.getItem('inspektor-connection-credentials')).toContain(
      'other-session-secret',
    )
    expect(resolveRuntimeConnection(sessionProfile)).toBeNull()
    expect(resolveRuntimeConnection(otherProfile)?.adminSecret).toBe('other-session-secret')
  })
})
