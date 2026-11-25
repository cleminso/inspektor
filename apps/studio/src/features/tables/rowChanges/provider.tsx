import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { ColumnDescriptor } from 'jazz-tools'
import { createTableAccess } from '@inspektor/core/jazz/client'
import type { FieldIntent } from '@inspektor/core/draft'
import type { RowEditingTable } from '@inspektor/core/workbench/rowEditing'

import { useRuntimeClient, useRuntimeSchema } from '@app/runtime/runtimeProvider'
import { useTableRowChangeWorkspace } from './workspaceProvider'
import type { DynamicTableRow } from '@tables/tableTypes'

interface TableRowChangesContextValue {
  editing: RowEditingTable<DynamicTableRow>
  schemaColumns: readonly ColumnDescriptor[]
}

const TableRowChangesContext = createContext<TableRowChangesContextValue | null>(null)

/** Supplies table identity and Jazz access. The feature owns the workflow behind this adapter. */
export function TableRowChangesProvider({
  children,
  schemaColumns,
  scopeKey,
  tableName,
}: {
  children: ReactNode
  schemaColumns: readonly ColumnDescriptor[]
  scopeKey: string
  tableName: string
}): React.ReactElement {
  const workspace = useTableRowChangeWorkspace()
  const editing = workspace.table(scopeKey)
  const client = useRuntimeClient()
  const schema = useRuntimeSchema()
  const access = useMemo(
    () =>
      client === null || schema === null ? null : createTableAccess({ client, schema, tableName }),
    [client, schema, tableName],
  )
  useLayoutEffect(() => {
    workspace.attach(scopeKey, access)
  }, [access, scopeKey, workspace])
  const value = useMemo(() => ({ editing, schemaColumns }), [editing, schemaColumns])
  return <TableRowChangesContext value={value}>{children}</TableRowChangesContext>
}

function useRowChangesContext(): TableRowChangesContextValue {
  const context = use(TableRowChangesContext)
  if (context === null) throw new Error('Row changes require TableRowChangesProvider')
  return context
}

export function useTableRowChanges() {
  const { editing, schemaColumns } = useRowChangesContext()
  const snapshot = useSyncExternalStore(editing.subscribe, editing.getSnapshot, editing.getSnapshot)
  const rebaseRows = useCallback(
    (rows: readonly DynamicTableRow[]) => editing.rebaseRows(rows, schemaColumns),
    [editing, schemaColumns],
  )
  return {
    ...snapshot,
    ...editing.project(schemaColumns),
    editing,
    rebaseRows,
  }
}

/** Converts feature observations and semantic edits into the form's presentation contract. */
export function useTableRowChangeEditor({
  initialRowValues,
  rowId,
}: {
  initialRowValues: Record<string, unknown>
  rowId: string
}) {
  const { editing, schemaColumns } = useRowChangesContext()
  useSyncExternalStore(editing.subscribe, editing.getSnapshot, editing.getSnapshot)
  useEffect(() => {
    editing.rebaseRows([{ ...initialRowValues, id: rowId }], schemaColumns)
  }, [editing, initialRowValues, rowId, schemaColumns])
  const draft = editing.editor(rowId, initialRowValues, schemaColumns)
  const setFieldInput = useCallback(
    (name: string, input: FieldIntent) => {
      editing.setFieldInput(rowId, initialRowValues, schemaColumns, name, input)
    },
    [editing, initialRowValues, rowId, schemaColumns],
  )
  return { draft, setFieldInput }
}
