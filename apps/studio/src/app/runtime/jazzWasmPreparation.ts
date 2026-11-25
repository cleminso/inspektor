import { Effect, Exit, Result } from 'effect'
import type { RuntimeSourcesConfig } from 'jazz-tools'

const jazzWasmVersion = 'b77335fef088f155325fa8b785bb3f1af928c02af66f9f0c28ca15ba3a765ab5'
const jazzWasmUrl = `https://assets.inspektor.dev/jazz/2.0.0-beta.2/${jazzWasmVersion}/jazz_wasm_bg.bin`

const jazzWasmPreparation = Effect.runSync(
  Effect.cachedWithTTL(
    Effect.tryPromise({
      try: async () => {
        const { loadWasmModule } = await import('jazz-tools')
        await loadWasmModule(getJazzWasmRuntimeSources(import.meta.env.PROD))
      },
      catch: (error) => error,
    }),
    (exit) => (Exit.isSuccess(exit) === true ? Infinity : 0),
  ),
)

export function getJazzWasmRuntimeSources(isProduction: boolean): RuntimeSourcesConfig | undefined {
  return isProduction === true ? { wasmUrl: jazzWasmUrl, wasmVersion: jazzWasmVersion } : undefined
}

/**
 * Starts or joins the shared browser WASM preparation.
 *
 * Entry-point callers start this without awaiting it. The runtime scope joins the same
 * attempt before creating the Jazz client and owns visible failure handling. Success stays cached;
 * a later call retries a failed attempt. The Promise runner has no caller cancellation signal:
 * interrupting every runtime waiter must not abandon SDK work that can still finish.
 */
export function prepareJazzWasm(): Promise<void> {
  const preparation = Effect.runPromise(Effect.result(jazzWasmPreparation)).then((result) => {
    if (Result.isFailure(result) === true) {
      throw result.failure
    }
  })
  void preparation.catch(() => undefined)

  return preparation
}
