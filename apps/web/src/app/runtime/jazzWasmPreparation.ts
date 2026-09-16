import type { RuntimeSourcesConfig } from 'jazz-tools'

const jazzWasmVersion = '96c929d628c7819774409f40543df9a8929e0220550dd67807c19b18a8823cc0'
const jazzWasmUrl = `https://assets.inspektor.dev/jazz/2.0.0-alpha.55/${jazzWasmVersion}/jazz_wasm_bg.bin`

let jazzWasmPreparation: Promise<void> | null = null

export function getJazzWasmRuntimeSources(isProduction: boolean): RuntimeSourcesConfig | undefined {
  return isProduction === true ? { wasmUrl: jazzWasmUrl, wasmVersion: jazzWasmVersion } : undefined
}

/**
 * Starts one shared WASM load after connection navigation has been accepted.
 *
 * Accepted-intent callers start this without awaiting it. `RuntimeAdminClient` joins the same
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
