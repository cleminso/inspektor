let jazzWasmPreparation: Promise<void> | null = null

/**
 * Starts one best-effort WASM load after connection navigation has been accepted.
 *
 * Callers intentionally do not await this work: `InspectorProvider` joins it while creating the
 * Jazz client, and Jazz retains authoritative loading, error, and retry ownership. Route-owned
 * session synchronization must not call this function because starting and then awaiting the load
 * there serializes provider startup instead of overlapping accepted navigation.
 */
export function prepareJazzWasm(): Promise<void> {
  jazzWasmPreparation ??= import('jazz-tools')
    .then(({ loadWasmModule }) => loadWasmModule())
    .then(
      () => undefined,
      () => undefined,
    )
  return jazzWasmPreparation
}

/** Returns preparation only when accepted connection intent already started it. */
export function getJazzWasmPreparation(): Promise<void> | null {
  return jazzWasmPreparation
}
