import { Effect, Result, Schema } from 'effect'
import { PersistedWriteRejectedError, type WriteHandle, type WriteWaitOptions } from 'jazz-tools'

/** Native handles satisfy this contract without a wrapper or a replacement handle. */
export type WriteCapability<Value, Result> = Pick<
  WriteHandle<Value, Result>,
  'value' | 'txId' | 'wait'
>

export class WriteSubmissionFailed extends Schema.TaggedError<WriteSubmissionFailed>()(
  'WriteSubmissionFailed',
  { cause: Schema.Defect() },
) {}
export class WriteRejected extends Schema.TaggedError<WriteRejected>()('WriteRejected', {
  cause: Schema.instanceOf(PersistedWriteRejectedError),
}) {}
export class WriteUnresolved extends Schema.TaggedError<WriteUnresolved>()('WriteUnresolved', {
  cause: Schema.Defect(),
}) {}
export class WriteUnavailable extends Schema.TaggedError<WriteUnavailable>()('WriteUnavailable', {
  message: Schema.String,
}) {}

export type WriteState<Value, Result> =
  | { readonly status: 'submission'; readonly failure: WriteSubmissionFailed | null }
  | { readonly status: 'awaiting'; readonly handle: WriteCapability<Value, Result> }
  | {
      readonly status: 'confirmed'
      readonly handle: WriteCapability<Value, Result>
      readonly result: Result
    }
  | {
      readonly status: 'rejected'
      readonly handle: WriteCapability<Value, Result>
      readonly error: WriteRejected
    }
  | {
      readonly status: 'unresolved'
      readonly handle: WriteCapability<Value, Result>
      readonly error: WriteUnresolved
    }

/**
 * @lat: [[jazzAccess#Rows and writes]]
 * One in-memory submission, owned by one live client session. Jazz alone settles it.
 * Submission is synchronous and retained before any interruptible wait starts.
 * This object does not establish recovery across reload or client replacement.
 */
export class WriteOperation<Value, Result> {
  readonly owner: object
  readonly #submit: () => WriteCapability<Value, Result>
  #state: WriteState<Value, Result> = { status: 'submission', failure: null }
  #submitted = false
  #waiting = false
  #attempt = 0
  readonly #listeners = new Set<() => void>()

  #setState(state: WriteState<Value, Result>): void {
    this.#state = state
    for (const listener of this.#listeners) {
      try {
        listener()
      } catch {
        /* Observation cannot change a native verdict. */
      }
    }
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  constructor(options: {
    readonly owner: object
    readonly submit: () => WriteCapability<Value, Result>
  }) {
    this.owner = options.owner
    this.#submit = options.submit
  }

  get state(): WriteState<Value, Result> {
    return this.#state
  }

  submit(): Effect.Effect<void, WriteSubmissionFailed | WriteUnavailable> {
    return Effect.uninterruptible(
      Effect.suspend((): Effect.Effect<void, WriteSubmissionFailed | WriteUnavailable> => {
        if (this.#submitted === true) {
          return Effect.fail(
            new WriteUnavailable({
              message: 'This operation was already submitted. Do not submit it again.',
            }),
          )
        }
        this.#submitted = true
        return Effect.try({
          try: () => {
            const handle = this.#submit()
            this.#setState({ status: 'awaiting', handle })
          },
          catch: (cause) => {
            const failure = new WriteSubmissionFailed({ cause })
            this.#setState({ status: 'submission', failure })
            return failure
          },
        })
      }),
    )
  }

  wait(
    owner: object,
    options?: { readonly timeoutMs?: number | undefined },
  ): Effect.Effect<Result, WriteRejected | WriteUnresolved | WriteUnavailable> {
    return Effect.uninterruptibleMask((restore) =>
      Effect.suspend(
        (): Effect.Effect<Result, WriteRejected | WriteUnresolved | WriteUnavailable> => {
          if (owner !== this.owner) {
            return Effect.fail(
              new WriteUnavailable({
                message:
                  'The original client session is required. Recovery on another client is not supported.',
              }),
            )
          }
          const state = this.#state
          if (state.status === 'submission') {
            return Effect.fail(
              new WriteUnavailable({ message: 'No native write handle is available.' }),
            )
          }
          if (state.status === 'confirmed') return Effect.succeed(state.result)
          if (state.status === 'rejected') return Effect.fail(state.error)
          if (this.#waiting === true) {
            return Effect.fail(
              new WriteUnavailable({ message: 'This write already has an active wait.' }),
            )
          }
          const handle = state.handle
          const attempt = ++this.#attempt
          this.#waiting = true
          this.#setState({ status: 'awaiting', handle })
          const waitOptions: WriteWaitOptions =
            options?.timeoutMs === undefined
              ? { tier: 'global' }
              : { tier: 'global', timeoutMs: options.timeoutMs }
          return restore(
            Effect.tryPromise({
              try: async () => {
                try {
                  const result = await handle.wait(waitOptions)
                  // Record both native verdicts before Effect observes the promise.
                  this.#setState({ status: 'confirmed', handle, result })
                  return result
                } catch (cause) {
                  if (cause instanceof PersistedWriteRejectedError) {
                    const error = new WriteRejected({ cause })
                    this.#setState({ status: 'rejected', handle, error })
                    throw error
                  }
                  const error = new WriteUnresolved({ cause })
                  if (this.#attempt === attempt && this.#state.status === 'awaiting') {
                    this.#setState({ status: 'unresolved', handle, error })
                  }
                  throw error
                }
              },
              catch: (cause) =>
                cause instanceof WriteRejected || cause instanceof WriteUnresolved
                  ? cause
                  : new WriteUnresolved({ cause }),
            }),
          ).pipe(
            Effect.onInterrupt(() =>
              Effect.sync(() => {
                if (this.#attempt === attempt && this.#state.status === 'awaiting') {
                  this.#setState({
                    status: 'unresolved',
                    handle,
                    error: new WriteUnresolved({
                      cause: 'Waiting was interrupted. The write was not cancelled.',
                    }),
                  })
                }
              }),
            ),
            Effect.ensuring(
              Effect.sync(() => {
                this.#waiting = false
              }),
            ),
          )
        },
      ),
    )
  }
}

export const createWrite = <Value, Result>(options: {
  readonly owner: object
  readonly submit: () => WriteCapability<Value, Result>
}): WriteOperation<Value, Result> => new WriteOperation(options)

export const submitWrite = <Value, Result>(operation: WriteOperation<Value, Result>) =>
  operation.submit()

export const waitForWrite = <Value, Result>(
  operation: WriteOperation<Value, Result>,
  owner: object,
  options?: { readonly timeoutMs?: number | undefined },
) => operation.wait(owner, options)

/** Resume only waits on the original handle. It never calls the submission capability. */
export const resumeWrite = waitForWrite

/** Bound native capabilities borrow a client. They neither acquire nor replace it. */
export interface TableWriteAccess<Row extends { id: string }> {
  readonly owner: object
  readonly readRow: (rowId: string) => Promise<Row | null>
  readonly insert: (values: Record<string, unknown>) => WriteCapability<Row, Row>
  readonly update: (rowId: string, values: Record<string, unknown>) => WriteCapability<void, void>
  readonly delete: (rowId: string) => WriteCapability<void, void>
}

export interface TableWriteSnapshot {
  readonly operation: WriteOperation<unknown, unknown> | null
  readonly state: WriteState<unknown, unknown> | null
  readonly pendingWrite: WriteState<unknown, unknown> | null
  readonly waiting: boolean
  readonly command: TableWriteCommand | null
  readonly retired: boolean
  readonly reloadRequired: boolean
  readonly retirementMessage: string | null
}

export type TableWriteCommand =
  | { readonly kind: 'insert'; readonly values: Readonly<Record<string, unknown>> }
  | {
      readonly kind: 'update'
      readonly rowId: string
      readonly values: Readonly<Record<string, unknown>>
    }
  | { readonly kind: 'delete'; readonly rowId: string }

export const unknownWriteWarning =
  'Write outcome is unknown. Reload, then verify server data before another write.'

export const retiredWriteWarning = (verdict?: 'confirmed' | 'rejected'): string => {
  if (verdict === 'confirmed') return 'Previous write confirmed. Reload before another write.'
  if (verdict === 'rejected') return 'Previous write rejected. Reload before another write.'
  return unknownWriteWarning
}

/**
 * @lat: [[jazzAccess#Rows and writes]]
 * One observable table coordinator per borrowed runtime identity. A stopped wait
 * keeps the original caller's promise pending. Resume settles that same promise,
 * so the UI continuation cannot accidentally submit the mutation again.
 */
export function createTableWriteCoordinator<Row extends { id: string }>(options: {
  readonly access: TableWriteAccess<Row> | null
  readonly waitOptions?: { readonly timeoutMs?: number | undefined } | undefined
}) {
  const listeners = new Set<() => void>()
  let lastOperation: WriteOperation<unknown, unknown> | null = null
  let command: TableWriteCommand | null = null
  let retired = false
  let reloadRequired = false
  let pending: {
    readonly operation: WriteOperation<unknown, unknown>
    readonly resume: (waitOptions?: { readonly timeoutMs?: number | undefined }) => Promise<void>
    waiting: boolean
    readonly reject: (error: unknown) => void
    readonly release: () => void
    stopped: Promise<void>
    stopWait: () => void
  } | null = null
  let waitFailure: WriteUnresolved | null = null
  let snapshot: TableWriteSnapshot = {
    operation: null,
    state: null,
    pendingWrite: null,
    waiting: false,
    command: null,
    retired: false,
    reloadRequired: false,
    retirementMessage: null,
  }
  const publish = () => {
    const nativeState = lastOperation?.state ?? null
    const state =
      nativeState?.status === 'awaiting' && waitFailure !== null
        ? { status: 'unresolved' as const, handle: nativeState.handle, error: waitFailure }
        : nativeState
    const pendingWrite = pending === null ? null : state
    const waiting = retired === false && (pending?.waiting ?? false)
    if (
      snapshot.operation === lastOperation &&
      snapshot.state === state &&
      snapshot.pendingWrite === pendingWrite &&
      snapshot.waiting === waiting &&
      snapshot.retired === retired
    )
      return
    snapshot = {
      operation: lastOperation,
      state,
      pendingWrite,
      waiting,
      command,
      retired,
      reloadRequired,
      retirementMessage:
        retired === true && reloadRequired === true
          ? retiredWriteWarning(
              state?.status === 'confirmed' || state?.status === 'rejected'
                ? state.status
                : undefined,
            )
          : null,
    }
    for (const listener of listeners) {
      try {
        listener()
      } catch {
        // An observation failure cannot change Jazz's verdict or strand the command.
      }
    }
  }
  const retiredError = () =>
    new WriteUnavailable({
      message: snapshot.retirementMessage ?? 'The original client session is no longer active.',
    })
  const getAccess = () => {
    if (retired === true) throw retiredError()
    if (options.access === null) {
      throw new WriteUnavailable({ message: 'Table runtime is not loaded.' })
    }
    return options.access
  }
  const runWrite = async <Value, WaitResult>(
    nextCommand: TableWriteCommand,
    submit: () => WriteCapability<Value, WaitResult>,
  ): Promise<WaitResult> => {
    const access = getAccess()
    if (pending !== null) {
      throw new WriteUnavailable({ message: 'A write is still pending. Resume its original wait.' })
    }
    const operation = createWrite({ owner: access.owner, submit })
    let resolveResult: (result: WaitResult) => void = () => {}
    let rejectResult: (error: unknown) => void = () => {}
    const completion = new Promise<WaitResult>((resolve, reject) => {
      resolveResult = resolve
      rejectResult = reject
    })
    // Retirement can precede adoption by the async submission facade.
    void completion.catch(() => {})
    const slot = {
      operation,
      reject: rejectResult,
      release: () => {},
      stopped: Promise.resolve(),
      stopWait: () => {},
      waiting: false,
      resume: async (waitOptions?: { readonly timeoutMs?: number | undefined }) => {
        if (retired === true) throw retiredError()
        if (slot.waiting === true || pending !== slot || operation.state.status === 'submission')
          return
        slot.waiting = true
        slot.stopped = new Promise<void>((resolve) => {
          slot.stopWait = resolve
        })
        waitFailure = null
        publish()
        try {
          const result = await Effect.runPromise(
            Effect.result(waitForWrite(operation, access.owner, waitOptions)),
          )
          if (snapshot.retired === true || pending !== slot) return
          if (Result.isFailure(result)) {
            waitFailure =
              result.failure instanceof WriteUnresolved
                ? result.failure
                : new WriteUnresolved({ cause: result.failure })
          }
        } catch (cause) {
          if (retired === false && pending === slot) waitFailure = new WriteUnresolved({ cause })
        } finally {
          slot.waiting = false
          slot.stopWait()
          publish()
        }
      },
    }
    pending = slot
    lastOperation = operation
    command = nextCommand
    waitFailure = null
    slot.release = operation.subscribe(() => {
      if (pending !== slot) return
      const state = operation.state
      if (state.status === 'confirmed') {
        pending = null
        slot.release()
        resolveResult(state.result)
      } else if (state.status === 'rejected') {
        pending = null
        slot.release()
        rejectResult(state.error.cause)
      }
      publish()
    })
    publish()
    if (retired === true) throw retiredError()
    const submitted = await Effect.runPromise(Effect.result(submitWrite(operation)))
    if (Result.isFailure(submitted)) {
      if (pending === slot) pending = null
      slot.release()
      publish()
      throw submitted.failure
    }
    publish()
    if (retired === false) void slot.resume(options.waitOptions)
    return completion
  }
  return {
    getSnapshot: (): TableWriteSnapshot => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    readRow: async (rowId: string): Promise<Row | null> => getAccess().readRow(rowId),
    insertRow: async (values: Record<string, unknown>): Promise<string> => {
      const access = getAccess()
      const row = await runWrite({ kind: 'insert', values }, () => access.insert(values))
      return row.id
    },
    updateRow: async (rowId: string, values: Record<string, unknown>): Promise<void> => {
      const access = getAccess()
      await runWrite({ kind: 'update', rowId, values }, () => access.update(rowId, values))
    },
    deleteRow: async (rowId: string): Promise<void> => {
      const access = getAccess()
      await runWrite({ kind: 'delete', rowId }, () => access.delete(rowId))
    },
    resumePending: async (waitOptions?: {
      readonly timeoutMs?: number | undefined
    }): Promise<void> => {
      if (retired === true) throw retiredError()
      const slot = pending
      if (slot?.waiting === true) await slot.stopped
      if (snapshot.retired === true) throw retiredError()
      if (pending === slot) await slot?.resume(waitOptions)
    },
    retire: () => {
      if (retired === true) return
      reloadRequired = pending !== null
      retired = true
      waitFailure = new WriteUnresolved({ cause: unknownWriteWarning })
      pending?.reject(new WriteUnavailable({ message: unknownWriteWarning }))
      pending?.stopWait()
      publish()
    },
  }
}

export type TableWriteCoordinator<Row extends { id: string }> = ReturnType<
  typeof createTableWriteCoordinator<Row>
>

export type WriteWorkspaceEvent = {
  readonly scopeKey: string
  readonly coordinator: object
  readonly operation: object
  readonly command: TableWriteCommand
} & (
  | { readonly status: 'applying' | 'confirmed' | 'retired' }
  | { readonly status: 'failed' | 'rejected'; readonly error: unknown }
)

/**
 * @lat: [[rowChanges#Persistence outcome]]
 * The workspace owns coordinators and ledger transitions independently of views.
 * Retirement blocks admission without suppressing native verdicts. A replacement
 * client cannot take over the retained command.
 */
export function createTableWriteWorkspace<Row extends { id: string }>(options: {
  readonly onTransition: (event: WriteWorkspaceEvent) => void
}) {
  type Entry = {
    coordinator: TableWriteCoordinator<Row> | null
    owner: object | null
    release: () => void
    settled: object | null
    retired: boolean
    snapshot: TableWriteSnapshot
    listeners: Set<() => void>
    table: TableWriteCoordinator<Row>
  }
  const entries = new Map<string, Entry>()
  let disposed = false
  const get = (scopeKey: string): Entry => {
    const existing = entries.get(scopeKey)
    if (existing !== undefined) return existing
    const unloaded = createTableWriteCoordinator<Row>({ access: null })
    const entry: Entry = {
      coordinator: null,
      owner: null,
      release: () => {},
      settled: null,
      retired: false,
      snapshot: unloaded.getSnapshot(),
      listeners: new Set(),
      table: {
        getSnapshot: () => entry.coordinator?.getSnapshot() ?? entry.snapshot,
        subscribe: (listener) => {
          entry.listeners.add(listener)
          return () => {
            entry.listeners.delete(listener)
          }
        },
        readRow: (rowId) => (entry.coordinator ?? unloaded).readRow(rowId),
        insertRow: (values) => (entry.coordinator ?? unloaded).insertRow(values),
        updateRow: (rowId, values) => (entry.coordinator ?? unloaded).updateRow(rowId, values),
        deleteRow: (rowId) => (entry.coordinator ?? unloaded).deleteRow(rowId),
        resumePending: (waitOptions) => (entry.coordinator ?? unloaded).resumePending(waitOptions),
        retire: () => retire(scopeKey, entry),
      },
    }
    entries.set(scopeKey, entry)
    return entry
  }
  const publish = (entry: Entry) => {
    entry.snapshot = entry.coordinator?.getSnapshot() ?? entry.snapshot
    for (const listener of entry.listeners) {
      try {
        listener()
      } catch {
        /* Observation cannot change write settlement. */
      }
    }
  }
  const retire = (scopeKey: string, entry: Entry) => {
    if (entry.retired === true || entry.coordinator === null) return
    const { operation, command, pendingWrite } = entry.coordinator.getSnapshot()
    entry.retired = true
    entry.coordinator.retire()
    publish(entry)
    if (operation !== null && command !== null && pendingWrite !== null) {
      options.onTransition({
        scopeKey,
        coordinator: entry.coordinator,
        operation,
        command,
        status: 'retired',
      })
    }
  }
  return {
    table: (scopeKey: string) => get(scopeKey).table,
    attach: (scopeKey: string, access: TableWriteAccess<Row> | null) => {
      if (disposed === true || access === null) return
      const entry = get(scopeKey)
      if (entry.snapshot.reloadRequired === true) return
      if (entry.owner === access.owner) return
      if (entry.coordinator !== null && entry.coordinator.getSnapshot().pendingWrite !== null) {
        retire(scopeKey, entry)
        return
      }
      entry.release()
      const coordinator = createTableWriteCoordinator({ access })
      entry.coordinator = coordinator
      entry.owner = access.owner
      entry.retired = false
      entry.settled = null
      entry.release = coordinator.subscribe(() => {
        if (entry.coordinator !== coordinator) return
        const state = coordinator.getSnapshot()
        const { operation, command } = state
        if (operation !== null && command !== null) {
          const ticket = { scopeKey, coordinator, operation, command }
          if (
            entry.retired === false &&
            state.state?.status === 'submission' &&
            state.state.failure === null
          ) {
            options.onTransition({ ...ticket, status: 'applying' })
          } else if (entry.settled !== operation) {
            if (state.state?.status === 'confirmed') {
              entry.settled = operation
              options.onTransition({ ...ticket, status: 'confirmed' })
            } else if (state.state?.status === 'rejected') {
              entry.settled = operation
              options.onTransition({ ...ticket, status: 'rejected', error: state.state.error })
            } else if (state.state?.status === 'submission' && state.state.failure !== null) {
              entry.settled = operation
              options.onTransition({ ...ticket, status: 'failed', error: state.state.failure })
            }
          }
        }
        publish(entry)
      })
      publish(entry)
    },
    retireOwner: (owner: object) => {
      for (const [scopeKey, entry] of entries) {
        if (entry.owner === owner) retire(scopeKey, entry)
      }
    },
    dispose: () => {
      if (disposed === true) return
      disposed = true
      for (const [scopeKey, entry] of entries) {
        retire(scopeKey, entry)
        entry.release()
        entry.listeners.clear()
      }
    },
  }
}
