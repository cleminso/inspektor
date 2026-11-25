import type { ColumnDescriptor } from 'jazz-tools'
import {
  editField,
  fieldReadOnlyReason,
  projectDraft,
  rebaseDraft,
  submitDraft,
  updateDraft,
  type DraftValues,
  type FieldIntent,
  type RowDraft,
} from '../studio/draft.ts'
import {
  createTableWriteWorkspace,
  WriteUnavailable,
  type TableWriteAccess,
  type TableWriteSnapshot,
  type WriteWorkspaceEvent,
} from '../studio/write.ts'

export interface RowEditingSnapshot {
  readonly execution: {
    readonly status: 'idle' | 'applying' | 'failed' | 'retired'
    readonly error: string | null
  }
  readonly draftCount: number
  readonly busy: boolean
  readonly isAvailable: boolean
  readonly pendingWrite: TableWriteSnapshot['pendingWrite']
  readonly nativeState: TableWriteSnapshot['state']
  readonly waiting: boolean
  readonly reloadRequired: boolean
  readonly retired: boolean
  readonly retirementMessage: string | null
}

export type SaveRowOutcome<Row> =
  | { readonly status: 'invalid'; readonly errors: Readonly<Record<string, string>> }
  | { readonly status: 'unchanged' }
  | { readonly status: 'saved'; readonly row: Row | null; readonly fields: ReadonlySet<string> }
  | {
      readonly status: 'savedRefreshFailed'
      readonly error: unknown
      readonly fields: ReadonlySet<string>
    }

export interface RowEditingProjection {
  readonly draftFieldsByRowId: Readonly<Record<string, ReadonlySet<string>>>
  readonly draftValuesByRowId: Readonly<Record<string, DraftValues>>
}

export interface RowEditingTable<Row extends { id: string }> {
  readonly getSnapshot: () => RowEditingSnapshot
  readonly subscribe: (listener: () => void) => () => void
  readonly project: (columns: readonly ColumnDescriptor[]) => RowEditingProjection
  readonly editor: (
    rowId: string,
    source: DraftValues,
    columns: readonly ColumnDescriptor[],
  ) => RowDraft
  readonly setFieldInput: (
    rowId: string,
    source: DraftValues,
    columns: readonly ColumnDescriptor[],
    name: string,
    input: FieldIntent,
  ) => boolean
  readonly rebaseRows: (
    rows: readonly (DraftValues & { readonly id: string })[],
    columns: readonly ColumnDescriptor[],
  ) => void
  readonly discardAll: () => boolean
  readonly saveRow: (
    rowId: string,
    columns: readonly ColumnDescriptor[],
  ) => Promise<SaveRowOutcome<Row>>
  readonly insertRow: (payload: DraftValues) => Promise<string>
  readonly deleteRow: (rowId: string) => Promise<void>
  readonly loadDuplicate: (
    rowId: string,
    columns: readonly ColumnDescriptor[],
  ) => Promise<DraftValues>
  readonly resumePending: (options?: { readonly timeoutMs?: number | undefined }) => Promise<void>
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function retain(draft: RowDraft): RowDraft {
  return Object.freeze({
    ...draft,
    sourceValues: Object.freeze({ ...draft.sourceValues }),
    fieldInputs: Object.freeze(
      Object.fromEntries(
        Object.entries(draft.fieldInputs).map(([name, input]) => [
          name,
          Object.freeze({ ...input }),
        ]),
      ),
    ),
  })
}

/**
 * @lat: [[rowChanges#Workflow ownership]]
 * Draft rules and native coordination keep their existing owners. This workspace
 * connects submitted draft identities to native verdicts and owns admission
 * through the subsequent remote refresh.
 */
export function createRowEditingWorkspace<Row extends { id: string }>() {
  type Ticket = {
    readonly kind: 'update' | 'delete'
    readonly rowId: string
    readonly draft: RowDraft
    coordinator: object | null
    operation: object | null
  }
  type Entry = {
    readonly scopeKey: string
    readonly drafts: Map<string, RowDraft>
    readonly listeners: Set<() => void>
    readonly table: RowEditingTable<Row>
    owner: object | null
    available: boolean
    busy: boolean
    ticket: Ticket | null
    execution: RowEditingSnapshot['execution']
    snapshot: RowEditingSnapshot
    release: () => void
  }
  const entries = new Map<string, Entry>()
  const listeners = new Set<() => void>()
  let disposed = false
  const notify = (observers: Set<() => void>) => {
    for (const listener of observers) {
      try {
        listener()
      } catch {
        // Observation must not change draft retention or a native verdict.
      }
    }
  }
  const writes = createTableWriteWorkspace<Row>({
    onTransition: (event: WriteWorkspaceEvent) => {
      const entry = entries.get(event.scopeKey)
      if (entry === undefined) return
      const ticket = entry.ticket
      if (event.status === 'applying') {
        if (ticket !== null && ticket.operation === null) {
          ticket.coordinator = event.coordinator
          ticket.operation = event.operation
        }
        entry.execution = { status: 'applying', error: null }
      } else if (event.status === 'confirmed') {
        if (
          ticket !== null &&
          ticket.coordinator === event.coordinator &&
          ticket.operation === event.operation &&
          event.command.kind !== 'insert' &&
          event.command.kind === ticket.kind &&
          event.command.rowId === ticket.rowId
        ) {
          if (entry.drafts.get(ticket.rowId) === ticket.draft) entry.drafts.delete(ticket.rowId)
          entry.ticket = null
        }
        if (entry.execution.status !== 'retired') {
          entry.execution = { status: 'idle', error: null }
        }
      } else if (event.status === 'failed' || event.status === 'rejected') {
        if (ticket?.operation === event.operation && ticket.coordinator === event.coordinator) {
          entry.ticket = null
        }
        if (entry.execution.status !== 'retired') {
          entry.execution = { status: 'failed', error: message(event.error) }
        }
      } else if (event.status === 'retired') {
        entry.execution = { status: 'retired', error: null }
      }
      publish(entry)
    },
  })
  const publish = (entry: Entry) => {
    const native = writes.table(entry.scopeKey).getSnapshot()
    const retired = entry.execution.status === 'retired' || native.retired
    entry.snapshot = Object.freeze({
      execution: Object.freeze({
        ...entry.execution,
        status: retired === true ? 'retired' : entry.execution.status,
      }),
      draftCount: entry.drafts.size,
      busy: entry.busy || native.pendingWrite !== null,
      isAvailable: entry.available && retired === false && disposed === false,
      pendingWrite: native.pendingWrite,
      nativeState: native.state,
      waiting: native.waiting,
      reloadRequired: native.reloadRequired,
      retired,
      retirementMessage: native.retirementMessage,
    })
    notify(entry.listeners)
    notify(listeners)
  }
  const unavailable = (entry: Entry) =>
    new WriteUnavailable({
      message:
        entry.snapshot.retirementMessage ??
        (entry.snapshot.isAvailable === false
          ? 'Table runtime is not available.'
          : 'A row command is still pending. Resume its original wait if needed.'),
    })
  const admit = (entry: Entry) => {
    if (entry.snapshot.isAvailable === false || entry.snapshot.busy === true) {
      throw unavailable(entry)
    }
    // Set before calling an async facade, so a second command cannot enter.
    entry.busy = true
    publish(entry)
  }
  const finish = (entry: Entry) => {
    entry.busy = false
    publish(entry)
  }
  const fail = (entry: Entry, error: unknown) => {
    if (entry.execution.status !== 'retired') {
      entry.execution = { status: 'failed', error: message(error) }
    }
    publish(entry)
  }
  const store = (entry: Entry, rowId: string, draft: RowDraft) => {
    if (Object.keys(draft.fieldInputs).length === 0) entry.drafts.delete(rowId)
    else entry.drafts.set(rowId, retain(draft))
  }
  const get = (scopeKey: string): Entry => {
    const existing = entries.get(scopeKey)
    if (existing !== undefined) return existing
    const native = writes.table(scopeKey)
    const entry: Entry = {
      scopeKey,
      drafts: new Map(),
      listeners: new Set(),
      owner: null,
      available: false,
      busy: false,
      ticket: null,
      execution: { status: 'idle', error: null },
      snapshot: Object.freeze({
        execution: Object.freeze({ status: 'idle', error: null }),
        draftCount: 0,
        busy: false,
        isAvailable: false,
        pendingWrite: null,
        nativeState: null,
        waiting: false,
        reloadRequired: false,
        retired: false,
        retirementMessage: null,
      }),
      release: () => {},
      table: {
        getSnapshot: () => entry.snapshot,
        subscribe: (listener) => {
          entry.listeners.add(listener)
          return () => {
            entry.listeners.delete(listener)
          }
        },
        project: (columns) => {
          const fields: Record<string, ReadonlySet<string>> = {}
          const values: Record<string, DraftValues> = {}
          for (const [rowId, draft] of entry.drafts) {
            const projection = projectDraft(draft, columns)
            const names = Object.keys(projection.displayValues)
            if (names.length === 0) continue
            Object.defineProperty(fields, rowId, { value: new Set(names), enumerable: true })
            Object.defineProperty(values, rowId, {
              value: Object.freeze(projection.displayValues),
              enumerable: true,
            })
          }
          return Object.freeze({
            draftFieldsByRowId: Object.freeze(fields),
            draftValuesByRowId: Object.freeze(values),
          })
        },
        editor: (rowId, source, columns) => {
          const current = entry.drafts.get(rowId)
          if (current === undefined) return retain(updateDraft(source))
          // Failed/applying rows can include local echoes, not persistence evidence.
          return entry.execution.status === 'idle' && entry.busy === false
            ? retain(rebaseDraft(current, source, columns))
            : current
        },
        setFieldInput: (rowId, source, columns, name, input) => {
          if (disposed === true || entry.snapshot.retired === true) return false
          const column = columns.find((candidate) => candidate.name === name)
          if (column === undefined) return false
          const edited = editField(entry.table.editor(rowId, source, columns), column, input)
          if (edited.kind === 'rejected') return false
          store(entry, rowId, edited.draft)
          publish(entry)
          return true
        },
        rebaseRows: (rows, columns) => {
          if (entry.execution.status !== 'idle' || entry.snapshot.busy === true) return
          let changed = false
          for (const row of rows) {
            const draft = entry.drafts.get(row.id)
            if (draft === undefined) continue
            const rebased = rebaseDraft(draft, row, columns)
            if (rebased === draft) continue
            store(entry, row.id, rebased)
            changed = true
          }
          if (changed === true) publish(entry)
        },
        discardAll: () => {
          if (
            disposed === true ||
            entry.snapshot.busy === true ||
            entry.snapshot.reloadRequired === true
          )
            return false
          entry.drafts.clear()
          entry.execution = { status: 'idle', error: null }
          publish(entry)
          return true
        },
        saveRow: async (rowId, columns) => {
          // Busy/unavailable saves reject, even when the row is unchanged or invalid.
          admit(entry)
          const owner = entry.owner
          try {
            const draft = entry.drafts.get(rowId)
            if (draft === undefined) return { status: 'unchanged' }
            const submission = submitDraft(draft, columns)
            if (submission.kind === 'invalid') {
              return { status: 'invalid', errors: submission.errors }
            }
            const fields = new Set(Object.keys(submission.payload))
            if (fields.size === 0) return { status: 'unchanged' }
            entry.ticket = { kind: 'update', rowId, draft, coordinator: null, operation: null }
            try {
              await native.updateRow(rowId, { ...submission.payload })
            } catch (error) {
              fail(entry, error)
              throw error
            }
            try {
              if (entry.snapshot.retired === true || entry.owner !== owner) throw unavailable(entry)
              const row = await native.readRow(rowId)
              if (entry.table.getSnapshot().retired === true || entry.owner !== owner) {
                throw unavailable(entry)
              }
              return { status: 'saved', row, fields }
            } catch (error) {
              return { status: 'savedRefreshFailed', error, fields }
            }
          } finally {
            finish(entry)
          }
        },
        insertRow: async (payload) => {
          admit(entry)
          try {
            return await native.insertRow({ ...payload })
          } catch (error) {
            fail(entry, error)
            throw error
          } finally {
            finish(entry)
          }
        },
        deleteRow: async (rowId) => {
          admit(entry)
          const draft = entry.drafts.get(rowId)
          entry.ticket =
            draft === undefined
              ? null
              : { kind: 'delete', rowId, draft, coordinator: null, operation: null }
          try {
            await native.deleteRow(rowId)
          } catch (error) {
            fail(entry, error)
            throw error
          } finally {
            finish(entry)
          }
        },
        loadDuplicate: async (rowId, columns) => {
          admit(entry)
          const owner = entry.owner
          try {
            const row = await native.readRow(rowId)
            if (entry.snapshot.retired === true || entry.owner !== owner) throw unavailable(entry)
            if (row === null) throw new Error('Row is no longer available.')
            const draft = entry.drafts.get(rowId)
            const values: Record<string, unknown> = { ...row }
            if (draft !== undefined) {
              Object.assign(values, projectDraft(draft, columns).displayValues)
            }
            return Object.freeze(
              Object.fromEntries(
                columns
                  .filter((column) => fieldReadOnlyReason(column) !== 'automatic')
                  .filter((column) => Object.hasOwn(values, column.name))
                  .map((column) => [column.name, values[column.name]]),
              ),
            )
          } finally {
            // A read must not replace the prior write execution status.
            finish(entry)
          }
        },
        resumePending: (options) => native.resumePending(options),
      },
    }
    entries.set(scopeKey, entry)
    entry.release = native.subscribe(() => publish(entry))
    return entry
  }
  return {
    table: (scopeKey: string): RowEditingTable<Row> => get(scopeKey).table,
    attach: (scopeKey: string, access: TableWriteAccess<Row> | null) => {
      if (disposed === true) return
      const entry = get(scopeKey)
      if (access === null) {
        entry.available = false
        publish(entry)
        return
      }
      writes.attach(scopeKey, access)
      const native = writes.table(scopeKey).getSnapshot()
      if (native.retired === false) {
        entry.owner = access.owner
        entry.available = true
        if (entry.execution.status === 'retired') {
          entry.execution = { status: 'idle', error: null }
        }
      }
      publish(entry)
    },
    retireOwner: (owner: object) => {
      for (const entry of entries.values()) {
        if (entry.owner !== owner) continue
        entry.available = false
        entry.execution = { status: 'retired', error: null }
      }
      writes.retireOwner(owner)
      for (const entry of entries.values()) {
        if (entry.owner === owner) publish(entry)
      }
    },
    hasPendingChanges: (scopeKey?: string): boolean => {
      const scopes = scopeKey === undefined ? entries.values() : [entries.get(scopeKey)]
      return [...scopes].some(
        (entry) =>
          entry !== undefined &&
          (entry.drafts.size > 0 ||
            entry.snapshot.busy === true ||
            entry.snapshot.reloadRequired === true),
      )
    },
    discardPendingChanges: (scopeKey: string): boolean =>
      entries.get(scopeKey)?.table.discardAll() ?? false,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispose: () => {
      if (disposed === true) return
      disposed = true
      writes.dispose()
      for (const entry of entries.values()) {
        entry.available = false
        publish(entry)
        entry.release()
        entry.listeners.clear()
      }
      listeners.clear()
    },
  }
}

export type RowEditingWorkspace<Row extends { id: string }> = ReturnType<
  typeof createRowEditingWorkspace<Row>
>
