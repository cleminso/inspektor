import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

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
        'https://assets.inspektor.dev/jazz/2.0.0-alpha.59/49d0af280091fa462720a5739431cb516ab4d7cc8ca943faa0279ebcd008f056/jazz_wasm_bg.bin',
      wasmVersion: '49d0af280091fa462720a5739431cb516ab4d7cc8ca943faa0279ebcd008f056',
    }
    await prepareJazzWasm()

    expect(loadWasmModule).toHaveBeenCalledExactlyOnceWith(runtimeSources)
    expect(getJazzWasmRuntimeSources(true)).toEqual(runtimeSources)
    expect(getJazzWasmRuntimeSources(false)).toBeUndefined()
  })

  it('pins the production artifact to the installed Jazz WASM bytes', async () => {
    const require = createRequire(import.meta.url)
    const jazzRequire = createRequire(require.resolve('jazz-tools/package.json'))
    const wasmPackageDirectory = dirname(jazzRequire.resolve('jazz-wasm/package.json'))
    const wasmBytes = readFileSync(join(wasmPackageDirectory, 'pkg/jazz_wasm_bg.wasm'))
    const { getJazzWasmRuntimeSources } = await import('./jazzWasmPreparation')

    expect(getJazzWasmRuntimeSources(true)?.wasmVersion).toBe(
      createHash('sha256').update(wasmBytes).digest('hex'),
    )
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
