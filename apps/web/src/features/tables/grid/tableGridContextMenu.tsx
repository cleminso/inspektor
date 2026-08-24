import { cloneElement, useCallback, useRef, useState } from 'react'
import type { MouseEvent, ReactElement, ReactNode, TouchEvent } from 'react'

import {
  ContextMenu,
  type BinaryCopyFormat,
  type DataGridCellContextMenuHandler,
  type DataGridCellContextMenuTouchStartHandler,
  type DataGridCellTarget,
  type DataGridRowContextMenuHandler,
  type DataGridRowContextMenuTouchStartHandler,
  type DataGridViewportProps,
} from '@inspector/ds'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'

import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'

const binaryCopyFormatLabels = {
  base64: 'Base64',
  hex: 'Hex',
} satisfies Record<BinaryCopyFormat, string>

const contextTargetsByEvent = new WeakMap<Event, GridContextTarget>()

interface GridContextTarget {
  columnId?: string
  origin: HTMLElement
  returnFocus: HTMLElement
  rowId: string
}

interface TableGridContextMenuRenderProps {
  composeViewport: (viewport: ReactElement<DataGridViewportProps>) => ReactElement
  onCellContextMenu: DataGridCellContextMenuHandler
  onCellContextMenuTouchStart: DataGridCellContextMenuTouchStartHandler
  onRowContextMenu: DataGridRowContextMenuHandler
  onRowContextMenuTouchStart: DataGridRowContextMenuTouchStartHandler
}

interface TableGridContextMenuProps {
  children: (props: TableGridContextMenuRenderProps) => ReactNode
  getCellActions: (target: DataGridCellTarget) => TableGridCellActions
  onCopyCell: (target: DataGridCellTarget, format?: BinaryCopyFormat) => void
  onEditCell: (target: DataGridCellTarget) => void
  onFilterByCell: (target: DataGridCellTarget) => void
  onTouchCellContextMenuOpen: (target: DataGridCellTarget) => void
  revertField: (rowId: string, fieldName: string) => void
  revertRowUpdate: (rowId: string) => void
  stagedDeletionRowIds: ReadonlySet<string>
  stagedFieldsByRowId: Readonly<Record<string, ReadonlySet<string>>>
}

interface TableGridCellActions {
  canCopy: boolean
  canEdit: boolean
  canFilterBy: boolean
  copyAs: readonly BinaryCopyFormat[]
}

export function TableGridContextMenu({
  children,
  getCellActions,
  onCopyCell,
  onEditCell,
  onFilterByCell,
  onTouchCellContextMenuOpen,
  revertField,
  revertRowUpdate,
  stagedDeletionRowIds,
  stagedFieldsByRowId,
}: TableGridContextMenuProps): ReactElement {
  const [target, setTarget] = useState<GridContextTarget | null>(null)
  const finalFocusTargetRef = useRef<HTMLElement | null>(null)
  const suppressFinalFocusRef = useRef(false)
  const setContextTarget = useCallback(
    (
      contextTarget: { columnId?: string; rowId: string },
      origin: HTMLElement,
      nativeEvent: Event,
    ) => {
      const activeElement = document.activeElement
      const nextTarget = {
        ...contextTarget,
        origin,
        returnFocus:
          activeElement instanceof HTMLElement && activeElement !== document.body
            ? activeElement
            : origin,
      }
      contextTargetsByEvent.set(nativeEvent, nextTarget)
      setTarget(nextTarget)
    },
    [],
  )
  const rowHasUpdate = useCallback(
    (rowId: string) => {
      const stagedFields = stagedFieldsByRowId[rowId]
      return (
        stagedDeletionRowIds.has(rowId) === false &&
        stagedFields !== undefined &&
        [...stagedFields].some((fieldName) => fieldName !== tableGridSelectionColumnId)
      )
    },
    [stagedDeletionRowIds, stagedFieldsByRowId],
  )
  const hasContextActions = useCallback(
    ({ columnId, rowId }: { columnId?: string; rowId: string }) => {
      if (columnId === undefined) {
        return rowHasUpdate(rowId)
      }
      const actions = getCellActions({ columnId, rowId })
      return (
        rowHasUpdate(rowId) === true ||
        actions.canEdit === true ||
        actions.canFilterBy === true ||
        actions.canCopy === true
      )
    },
    [getCellActions, rowHasUpdate],
  )
  const onCellContextMenu = useCallback<DataGridCellContextMenuHandler>(
    (cellTarget, event) => {
      if (hasContextActions(cellTarget) === true) {
        setContextTarget(cellTarget, event.currentTarget, event.nativeEvent)
      }
    },
    [hasContextActions, setContextTarget],
  )
  const onRowContextMenu = useCallback<DataGridRowContextMenuHandler>(
    (rowId, event) => {
      if (hasContextActions({ rowId }) === true) {
        setContextTarget({ rowId }, event.currentTarget, event.nativeEvent)
      }
    },
    [hasContextActions, setContextTarget],
  )
  const onCellContextMenuTouchStart = useCallback<DataGridCellContextMenuTouchStartHandler>(
    (cellTarget, event) => {
      if (hasContextActions(cellTarget) === true) {
        setContextTarget(cellTarget, event.currentTarget, event.nativeEvent)
      }
    },
    [hasContextActions, setContextTarget],
  )
  const onRowContextMenuTouchStart = useCallback<DataGridRowContextMenuTouchStartHandler>(
    (rowId, event) => {
      if (hasContextActions({ rowId }) === true) {
        setContextTarget({ rowId }, event.currentTarget, event.nativeEvent)
      }
    },
    [hasContextActions, setContextTarget],
  )
  const composeViewport = useCallback(
    (viewport: ReactElement<DataGridViewportProps>) => (
      <ContextMenu.Trigger
        render={(triggerProps) =>
          cloneElement(viewport, {
            ...triggerProps,
            onTouchStart: (event: TouchEvent<HTMLDivElement>) => {
              if (contextTargetsByEvent.has(event.nativeEvent) === false) {
                return
              }
              triggerProps.onTouchStart?.(event)
            },
            onContextMenu: (event: MouseEvent<HTMLDivElement>) => {
              if (contextTargetsByEvent.has(event.nativeEvent) === false) {
                event.preventDefault()
                return
              }
              triggerProps.onContextMenu?.(event)
            },
          })
        }
      />
    ),
    [],
  )
  const stagedFields = target === null ? undefined : stagedFieldsByRowId[target.rowId]
  const cellFieldName = target?.columnId
  const hasRowUpdate = target !== null && rowHasUpdate(target.rowId)
  const hasCellUpdate =
    hasRowUpdate === true &&
    stagedFields !== undefined &&
    cellFieldName !== undefined &&
    cellFieldName !== tableGridSelectionColumnId &&
    stagedFields.has(cellFieldName)
  const cellTarget =
    target === null || target.columnId === undefined
      ? null
      : { columnId: target.columnId, rowId: target.rowId }
  const cellActions = cellTarget === null ? null : getCellActions(cellTarget)
  const hasPrimaryCellActions =
    cellActions !== null &&
    cellActions !== undefined &&
    (cellActions.canEdit === true ||
      cellActions.canFilterBy === true ||
      cellActions.canCopy === true)

  return (
    <ContextMenu.Root
      onOpenChange={(open, eventDetails) => {
        const touchTarget = contextTargetsByEvent.get(eventDetails.event)
        if (
          open === true &&
          eventDetails.reason === 'trigger-press' &&
          eventDetails.event.type.startsWith('touch') &&
          touchTarget?.columnId !== undefined
        ) {
          touchTarget.origin.focus()
          onTouchCellContextMenuOpen({ columnId: touchTarget.columnId, rowId: touchTarget.rowId })
        }
      }}
    >
      {children({
        composeViewport,
        onCellContextMenu,
        onCellContextMenuTouchStart,
        onRowContextMenu,
        onRowContextMenuTouchStart,
      })}
      <ContextMenu.Content
        finalFocus={() => {
          if (suppressFinalFocusRef.current === true) {
            suppressFinalFocusRef.current = false
            return false
          }
          const finalFocusTarget = finalFocusTargetRef.current
          finalFocusTargetRef.current = null
          return finalFocusTarget ?? target?.returnFocus ?? true
        }}
      >
        {cellActions?.canEdit === true && cellTarget !== null ? (
          <ContextMenu.Item
            onClick={() => {
              suppressFinalFocusRef.current = true
              onEditCell(cellTarget)
            }}
          >
            Edit
          </ContextMenu.Item>
        ) : null}
        {cellActions?.canFilterBy === true && cellTarget !== null ? (
          <ContextMenu.Item
            onClick={() => {
              onFilterByCell(cellTarget)
            }}
          >
            Filter by
          </ContextMenu.Item>
        ) : null}
        {cellActions?.canCopy === true && cellActions.copyAs.length === 0 && cellTarget !== null ? (
          <ContextMenu.Item
            onClick={() => {
              onCopyCell(cellTarget)
            }}
          >
            Copy
            <ContextMenu.Shortcut hotkey={appHotkeys.copyCell} />
          </ContextMenu.Item>
        ) : null}
        {cellActions?.canCopy === true && cellTarget !== null
          ? cellActions.copyAs.map((format) => (
              <ContextMenu.Item
                key={format}
                onClick={() => {
                  onCopyCell(cellTarget, format)
                }}
              >
                Copy as {binaryCopyFormatLabels[format]}
                {format === 'hex' ? <ContextMenu.Shortcut hotkey={appHotkeys.copyCell} /> : null}
              </ContextMenu.Item>
            ))
          : null}
        {hasPrimaryCellActions === true && (hasCellUpdate === true || hasRowUpdate === true) ? (
          <ContextMenu.Separator />
        ) : null}
        {hasCellUpdate === true && target !== null && cellFieldName !== undefined ? (
          <ContextMenu.Item
            onClick={() => {
              finalFocusTargetRef.current = target.origin
              revertField(target.rowId, cellFieldName)
            }}
          >
            Revert this change
          </ContextMenu.Item>
        ) : null}
        {hasCellUpdate === true && hasRowUpdate === true ? <ContextMenu.Separator /> : null}
        {hasRowUpdate === true && target !== null ? (
          <ContextMenu.Item
            onClick={() => {
              finalFocusTargetRef.current = target.origin
              revertRowUpdate(target.rowId)
            }}
          >
            Revert staged changes
          </ContextMenu.Item>
        ) : null}
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
