import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadWasmModule = vi.hoisted(() => vi.fn())

vi.mock('jazz-tools', () => ({ loadWasmModule }))

beforeEach(() => {
  loadWasmModule.mockReset()
})

afterEach(() => {
  vi.resetModules()
})

describe('Jazz WASM preparation', () => {
  it('shares one initialization attempt across repeated accepted intents', async () => {
    loadWasmModule.mockResolvedValue({})
    const { getJazzWasmPreparation, prepareJazzWasm } = await import('./jazzWasmPreparation')

    const firstPreparation = prepareJazzWasm()
    const secondPreparation = prepareJazzWasm()

    expect(secondPreparation).toBe(firstPreparation)
    expect(getJazzWasmPreparation()).toBe(firstPreparation)
    await firstPreparation
    expect(loadWasmModule).toHaveBeenCalledOnce()
  })

  it('settles safely when early initialization fails', async () => {
    loadWasmModule.mockRejectedValue(new Error('WASM failed'))
    const { prepareJazzWasm } = await import('./jazzWasmPreparation')

    await expect(prepareJazzWasm()).resolves.toBeUndefined()
  })
})
