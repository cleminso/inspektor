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
        'https://assets.inspektor.dev/jazz/2.0.0-alpha.54/a161d093cd2a1b1c65749997c2d5ce94fd10c813a1be5ab22982d3ff035248fa/jazz_wasm_bg.bin',
      wasmVersion: 'a161d093cd2a1b1c65749997c2d5ce94fd10c813a1be5ab22982d3ff035248fa',
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
