// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { describe, expect, it, vi } from 'vitest'

const moduleLoads = vi.hoisted(() => ({ jazz: 0, reactDevtools: 0 }))

vi.mock('@tanstack/react-devtools', () => {
  moduleLoads.reactDevtools += 1

  return {
    TanStackDevtools: vi.fn(),
  }
})

vi.mock('jazz-tools', () => {
  moduleLoads.jazz += 1

  return {
    fetchSchemaHashes: vi.fn(),
    fetchStoredPermissions: vi.fn(),
    fetchStoredWasmSchema: vi.fn(),
  }
})

vi.mock('jazz-tools/react', () => {
  moduleLoads.jazz += 1

  return {
    createJazzClient: vi.fn(),
  }
})

import './__root'

describe('root route module boundary', () => {
  it('does not initialize Jazz when the application root is imported', () => {
    expect(moduleLoads.jazz).toBe(0)
  })

  it('does not initialize React Devtools when the application root is imported', () => {
    expect(moduleLoads.reactDevtools).toBe(0)
  })
})
