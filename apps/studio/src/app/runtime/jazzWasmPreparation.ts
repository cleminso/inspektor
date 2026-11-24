import type { RuntimeSourcesConfig } from 'jazz-tools'

const jazzWasmVersion = 'b77335fef088f155325fa8b785bb3f1af928c02af66f9f0c28ca15ba3a765ab5'
const jazzWasmUrl = `https://assets.inspektor.dev/jazz/2.0.0-beta.2/${jazzWasmVersion}/jazz_wasm_bg.bin`

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
