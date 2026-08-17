import { useCallback, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

import {
  ContextMenu,
  type DataGridCellContextMenuHandler,
  type DataGridRowContextMenuHandler,
} from '@inspector/ds'

import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'

interface GridContextTarget {
  columnId?: string
  origin: HTMLElement
  rowId: string
}

export interface TableGridContextMenuRenderProps {
  composeViewport: (viewport: ReactElement) => ReactElement
  onCellContextMenu: DataGridCellContextMenuHandler
  onRowContextMenu: DataGridRowContextMenuHandler
}

interface TableGridContextMenuProps {
  children: (props: TableGridContextMenuRenderProps) => ReactNode
  revertField: (rowId: string, fieldName: string) => void
  revertRowUpdate: (rowId: string) => void
  stagedDeletionRowIds: ReadonlySet<string>
  stagedFieldsByRowId: Readonly<Record<string, ReadonlySet<string>>>
}

export function TableGridContextMenu({
  children,
  revertField,
  revertRowUpdate,
  stagedDeletionRowIds,
  stagedFieldsByRowId,
}: TableGridContextMenuProps): ReactElement {
  const [target, setTarget] = useState<GridContextTarget | null>(null)
  const focusTargetRef = useRef<HTMLElement | null>(null)
  const onCellContextMenu = useCallback<DataGridCellContextMenuHandler>((cellTarget, event) => {
    setTarget({ ...cellTarget, origin: event.currentTarget })
  }, [])
  const onRowContextMenu = useCallback<DataGridRowContextMenuHandler>((rowId, event) => {
    setTarget({ rowId, origin: event.currentTarget })
  }, [])
  const composeViewport = useCallback(
    (viewport: ReactElement) => <ContextMenu.Trigger render={viewport} />,
    [],
  )
  const stagedFields = target === null ? undefined : stagedFieldsByRowId[target.rowId]
  const cellFieldName = target?.columnId
  const isDeleted = target !== null && stagedDeletionRowIds.has(target.rowId)
  const hasRowUpdate =
    isDeleted === false &&
    stagedFields !== undefined &&
    [...stagedFields].some((fieldName) => fieldName !== tableGridSelectionColumnId)
  const hasCellUpdate =
    hasRowUpdate === true &&
    cellFieldName !== undefined &&
    cellFieldName !== tableGridSelectionColumnId &&
    stagedFields.has(cellFieldName)

  const restoreFocus = (origin: HTMLElement) => {
    focusTargetRef.current = origin
    origin.focus()
  }

  return (
    <ContextMenu.Root
      onOpenChangeComplete={(open) => {
        if (open === false) {
          focusTargetRef.current?.focus()
          focusTargetRef.current = null
        }
      }}
    >
      {children({ composeViewport, onCellContextMenu, onRowContextMenu })}
      <ContextMenu.Content>
        {hasCellUpdate === true && target !== null && cellFieldName !== undefined ? (
          <ContextMenu.Item
            onClick={() => {
              revertField(target.rowId, cellFieldName)
              restoreFocus(target.origin)
            }}
          >
            Revert this change
          </ContextMenu.Item>
        ) : null}
        {hasCellUpdate === true && hasRowUpdate === true ? <ContextMenu.Separator /> : null}
        {hasRowUpdate === true && target !== null ? (
          <ContextMenu.Item
            onClick={() => {
              revertRowUpdate(target.rowId)
              restoreFocus(target.origin)
            }}
          >
            Revert staged changes
          </ContextMenu.Item>
        ) : null}
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
