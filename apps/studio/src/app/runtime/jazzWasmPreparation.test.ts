import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadWasmModule = vi.hoisted(() => vi.fn())

vi.mock('jazz-tools', () => ({ loadWasmModule }))

beforeEach(() => {
  loadWasmModule.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('Jazz WASM preparation', () => {
  it('shares one initialization attempt across repeated accepted intents', async () => {
    loadWasmModule.mockResolvedValue({})
    const { prepareJazzWasm } = await import('./jazzWasmPreparation')

    const firstPreparation = prepareJazzWasm()
    const secondPreparation = prepareJazzWasm()

    expect(secondPreparation).toBe(firstPreparation)
    await firstPreparation
    expect(loadWasmModule).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it('loads the version-matched production artifact from the CDN', async () => {
    vi.stubEnv('PROD', true)
    loadWasmModule.mockResolvedValue({})
    const { getJazzWasmRuntimeSources, prepareJazzWasm } = await import('./jazzWasmPreparation')

    const runtimeSources = {
      wasmUrl:
        'https://assets.inspektor.dev/jazz/2.0.0-alpha.56/fe9d9506098f30d908789bae82ea59a275229e5e38d40e1445c94a00bbad7947/jazz_wasm_bg.bin',
      wasmVersion: 'fe9d9506098f30d908789bae82ea59a275229e5e38d40e1445c94a00bbad7947',
    }
    await prepareJazzWasm()

    expect(loadWasmModule).toHaveBeenCalledExactlyOnceWith(runtimeSources)
    expect(getJazzWasmRuntimeSources(true)).toEqual(runtimeSources)
    expect(getJazzWasmRuntimeSources(false)).toBeUndefined()
  })

  it('exposes a failed attempt and allows retry', async () => {
    const wasmError = new Error('WASM failed')
    loadWasmModule.mockRejectedValueOnce(wasmError).mockResolvedValueOnce({})
    const { prepareJazzWasm } = await import('./jazzWasmPreparation')

    await expect(prepareJazzWasm()).rejects.toBe(wasmError)
    await expect(prepareJazzWasm()).resolves.toBeUndefined()
    expect(loadWasmModule).toHaveBeenCalledTimes(2)
  })
})
