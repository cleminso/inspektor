// Do not prove the final Vite output. Prove that a module import does not initialize the deferred dependency int he Vitest module graph.
// Confirm the connection switcher can remain on the lightwieght session context without importing the jazz runtime provider.
import { describe, expect, it, vi } from 'vitest'

const runtimeProviderLoaded = vi.hoisted(() => vi.fn())

vi.mock('@app/providers/inspectorProvider', () => {
  runtimeProviderLoaded()

  return { useInspector: vi.fn() }
})

vi.mock('@app/providers/inspectorSessionProvider', () => ({
  useInspectorSessionContext: vi.fn(),
}))

import './connectionSwitcher'

describe('ConnectionSwitcher module boundary', () => {
  it('does not import the connection-scoped runtime provider', () => {
    expect(runtimeProviderLoaded).not.toHaveBeenCalled()
  })
})
