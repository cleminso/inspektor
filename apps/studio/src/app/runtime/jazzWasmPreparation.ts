import type { RuntimeSourcesConfig } from 'jazz-tools'

const jazzWasmVersion = '32c4b5643a71e61b7b8fec342c93d237676f734a6f8a1e7dd8a691d107deb707'
const jazzWasmUrl = `https://assets.inspektor.dev/jazz/2.0.0-alpha.57/${jazzWasmVersion}/jazz_wasm_bg.bin`

let jazzWasmPreparation: Promise<void> | null = null

export function getJazzWasmRuntimeSources(isProduction: boolean): RuntimeSourcesConfig | undefined {
  return isProduction === true ? { wasmUrl: jazzWasmUrl, wasmVersion: jazzWasmVersion } : undefined
}

/**
 * Starts one shared WASM load for a locally valid or accepted connection entry.
 *
 * Entry-point callers start this without awaiting it. `RuntimeAdminClient` joins the same
 * attempt before creating the Jazz client and owns visible failure handling. Failed attempts are
 * cleared so the runtime retry action can load the configured artifact again.
 */
export function prepareJazzWasm(): Promise<void> {
  if (jazzWasmPreparation !== null) {
    return jazzWasmPreparation
  }

  let preparation: Promise<void>
  preparation = import('jazz-tools')
    .then(({ loadWasmModule }) => loadWasmModule(getJazzWasmRuntimeSources(import.meta.env.PROD)))
    .then(() => undefined)
    .catch((error: unknown) => {
      if (jazzWasmPreparation === preparation) {
        jazzWasmPreparation = null
      }
      throw error
    })
  jazzWasmPreparation = preparation
  void preparation.catch(() => undefined)

  return jazzWasmPreparation
}
