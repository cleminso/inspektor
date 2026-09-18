import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type Ref } from 'react'

import { matchesKeyboardEvent } from '@tanstack/react-hotkeys'
import type { Column, ColumnDef } from '@tanstack/react-table'
import { ChevronDown, KeyRound, Undo2 } from 'lucide-react'

import {
  BinaryValue,
  Box,
  Checkbox,
  ContextMenu,
  Button,
  Menu,
  MiddleTruncate,
  StructuredValuePreview,
  Text,
  TimestampValue,
  Tooltip,
  Icon,
  type DataGridFeatures,
} from '@inspektor/ds'

import { productGlyphs } from '@app/icons/productGlyphs'
import { appHotkeys } from '@app/hotkeys/hotkeyCatalog'
import {
  getColumnTypeMarker,
  type ColumnTypeMarker as ColumnTypeMarkerModel,
} from '@tables/grid/columnTypeMarker'
import { RelationCellLink } from '@tables/grid/relationCellLink'
import { resolveStagedFieldValue } from '@tables/grid/stagedFieldValue'
import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'
import { classifySchemaValue, type SchemaValuePresentation } from '@tables/grid/valuePresentation'
import { normalizeColumnOrder, type ColumnMoveDirection } from '@tables/grid/useColumnOrder'
import type {
  TableColumnMeta,
  TableRowId,
  TableValuesByRowId,
  DynamicTableRow,
} from '@tables/tableTypes'

interface BuildDataGridColumnsOptions {
  columns: TableColumnMeta[]
  onColumnMenuOpen?: (columnId: string) => void
  onColumnMove?: (columnId: string, direction: ColumnMoveDirection) => void
  onRowSelectionRequest?: (rowId: TableRowId) => void
  onUndoRowDeletions?: (rowIds: readonly string[]) => void
}

/** Live values read by cell renderers without making them column-definition dependencies. */
interface TableGridMeta {
  stagedValuesByRowId?: TableValuesByRowId
}

interface ColumnSizing {
  maxSize?: number
  minSize: number
  size: number
}

function getColumnSizing(column: TableColumnMeta): ColumnSizing {
  if (column.id === 'id' || column.column === null) {
    return { size: 300, minSize: 154 }
  }

  if (column.column.references !== undefined) {
    return { size: 310, minSize: 170 }
  }

  switch (column.column.column_type.type) {
    case 'Boolean':
      return { size: 220, minSize: 120 }
    case 'Integer':
    case 'BigInt':
    case 'Double':
      return { size: 220, minSize: 120 }
    case 'Timestamp':
      return { size: 210, minSize: 114 }
    case 'Uuid':
      return { size: 220, minSize: 156 }
    case 'Json':
      return { size: 220, minSize: 160 }
    case 'Array':
      return { size: 220, minSize: 160 }
    case 'Row':
      return { size: 220, minSize: 160 }
    case 'Enum':
      return { size: 160, minSize: 120 }
    case 'Bytea':
      return { size: 144, minSize: 144 }
    case 'Text':
    default:
      return { size: 280, minSize: 120 }
  }
}

function CompactCellValue({
  isRowId,
  presentation,
}: {
  isRowId: boolean
  presentation: SchemaValuePresentation
}): React.ReactElement {
  if (presentation.kind === 'relation') {
    return (
      <RelationCellLink
        relationTable={presentation.relationTable}
        relationId={presentation.relationId}
      />
    )
  }

  if (presentation.kind === 'bytes') {
    return <BinaryValue byteLength={presentation.byteLength} />
  }

  if (presentation.kind === 'timestamp') {
    return <TimestampValue value={presentation.epochMilliseconds} />
  }

  if (presentation.kind === 'structured') {
    return (
      <StructuredValuePreview
        model={presentation.model}
        variant={presentation.variant}
      />
    )
  }

  if (isRowId === true && 'displayValue' in presentation) {
    return (
      <Text
        as="span"
        data-cell-overflow="middle-truncate"
        data-cell-typography="mono"
        monospace
      >
        <MiddleTruncate value={presentation.displayValue} />
      </Text>
    )
  }

  if (presentation.kind === 'number') {
    return (
      <Box
        justifyContent="start"
        width="full"
      >
        <Text
          as="span"
          data-cell-alignment="start"
          data-cell-typography="mono"
          data-numeric-variant="tabular"
          monospace
          tabularNums
          truncate
        >
          {presentation.displayValue}
        </Text>
      </Box>
    )
  }

  if (presentation.kind === 'boolean') {
    return (
      <Box
        as="span"
        alignItems="center"
        gap="xs"
      >
        <Text
          as="span"
          aria-label={`Boolean ${String(presentation.value)}`}
          color="muted"
        ></Text>
        <Text
          as="span"
          data-cell-typography="mono"
          monospace
        >
          {String(presentation.value)}
        </Text>
      </Box>
    )
  }

  const isSubdued = presentation.kind === 'null' || presentation.kind === 'unavailable'
  return (
    <Text
      as="span"
      color={
        presentation.kind === 'unsupported' || presentation.kind === 'invalid'
          ? 'danger'
          : isSubdued === true
            ? 'muted'
            : undefined
      }
      data-cell-overflow="truncate"
      data-cell-typography="mono"
      monospace
      truncate
    >
      {presentation.displayValue}
    </Text>
  )
}

interface SelectionCheckboxProps {
  ariaLabel: string
  checked: boolean
  checkboxRef?: Ref<HTMLElement>
  disabled?: boolean
  indeterminate?: boolean
  onCheckedChange: (checked: boolean, shiftKey: boolean) => void
}

function SelectionCheckbox({
  ariaLabel,
  checked,
  checkboxRef,
  disabled = false,
  indeterminate = false,
  onCheckedChange,
}: SelectionCheckboxProps): React.ReactElement {
  const shiftKeyRef = useRef(false)

  return (
    <Checkbox
      ref={checkboxRef}
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      indeterminate={indeterminate}
      size="m"
      onClickCapture={(event: MouseEvent<HTMLElement>) => {
        shiftKeyRef.current = event.shiftKey
      }}
      onCheckedChange={(nextChecked: boolean) => {
        onCheckedChange(nextChecked === true, shiftKeyRef.current)
        shiftKeyRef.current = false
      }}
    />
  )
}

interface PageSelectionControlProps {
  allRowsDeleted: boolean
  checked: boolean
  indeterminate: boolean
  onCheckedChange: (checked: boolean) => void
  onUndoDeletions?: () => void
}

function PageSelectionControl({
  allRowsDeleted,
  checked,
  indeterminate,
  onCheckedChange,
  onUndoDeletions,
}: PageSelectionControlProps): React.ReactElement {
  const checkboxRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef(false)

  useEffect(() => {
    if (allRowsDeleted === false && restoreFocusRef.current === true) {
      restoreFocusRef.current = false
      checkboxRef.current?.focus()
    }
  }, [allRowsDeleted])

  if (allRowsDeleted === true && onUndoDeletions !== undefined) {
    return (
      <Box
        alignItems="center"
        justifyContent="center"
        width="full"
      >
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Button
                type="button"
                aria-label="Undo pending deletion for all loaded rows"
                glyphSize="compact"
                iconOnly
                size="xs"
                variant="ghost"
                onClick={() => {
                  restoreFocusRef.current = true
                  onUndoDeletions()
                }}
              >
                <Button.Glyph artwork={Undo2} />
              </Button>
            }
          />
          <Tooltip.Content>Undo all pending deletions</Tooltip.Content>
        </Tooltip.Root>
      </Box>
    )
  }

  return (
    <SelectionCheckbox
      ariaLabel="Select all loaded rows"
      checked={checked}
      checkboxRef={checkboxRef}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
    />
  )
}

interface RowSelectionControlProps {
  canSelect: boolean
  checked: boolean
  onCheckedChange: (checked: boolean, shiftKey: boolean) => void
  onUndoDeletion?: () => void
  rowId: string
}

function RowSelectionControl({
  canSelect,
  checked,
  onCheckedChange,
  onUndoDeletion,
  rowId,
}: RowSelectionControlProps): React.ReactElement {
  const checkboxRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef(false)

  useEffect(() => {
    if (canSelect === true && restoreFocusRef.current === true) {
      restoreFocusRef.current = false
      checkboxRef.current?.focus()
    }
  }, [canSelect])

  if (canSelect === false && onUndoDeletion !== undefined) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Button
              type="button"
              aria-label={`Undo pending deletion for row ${rowId}`}
              glyphSize="compact"
              iconOnly
              size="xs"
              variant="ghost"
              onClick={() => {
                restoreFocusRef.current = true
                onUndoDeletion()
              }}
            >
              <Button.Glyph artwork={Undo2} />
            </Button>
          }
        />
        <Tooltip.Content>Undo pending deletion</Tooltip.Content>
      </Tooltip.Root>
    )
  }

  return (
    <SelectionCheckbox
      ariaLabel={`Select row ${rowId}`}
      checked={checked}
      checkboxRef={checkboxRef}
      disabled={canSelect === false}
      onCheckedChange={onCheckedChange}
    />
  )
}

function ColumnTypeMarker({ marker }: { marker: ColumnTypeMarkerModel }): React.ReactElement {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Text
            as="span"
            color="muted"
            variant="caption"
          >
            <Box
              as="span"
              alignItems="center"
              display="flex"
            >
              {marker.icon === 'key' ? (
                <Icon
                  artwork={KeyRound}
                  size="xs"
                />
              ) : null}
              {marker.icon === 'relation' ? (
                <Icon
                  artwork={productGlyphs.relation}
                  size="xs"
                />
              ) : null}
              {marker.suffix}
            </Box>
          </Text>
        }
      />
      <Tooltip.Content>{marker.label}</Tooltip.Content>
    </Tooltip.Root>
  )
}

export function ColumnDragPreview({ column }: { column: TableColumnMeta }): React.ReactElement {
  return (
    <Box
      as="span"
      alignItems="center"
      display="flex"
      gap="xxs"
      minWidth={0}
    >
      <ColumnTypeMarker marker={getColumnTypeMarker(column)} />
      <Text
        as="span"
        truncate
        variant="caption"
      >
        {column.label}
      </Text>
    </Box>
  )
}

const columnMoveHotkeys = [
  { direction: 'left', hotkey: appHotkeys.moveTableColumnLeft },
  { direction: 'right', hotkey: appHotkeys.moveTableColumnRight },
] as const satisfies readonly {
  direction: ColumnMoveDirection
  hotkey: (typeof appHotkeys)[keyof typeof appHotkeys]
}[]

function getColumnMoveAvailability(column: Column<DataGridFeatures, DynamicTableRow, unknown>): {
  left: boolean
  right: boolean
} {
  const pinnedPosition = column.getIsPinned()
  const visibleColumns =
    pinnedPosition === 'start'
      ? column.table.getStartVisibleLeafColumns()
      : pinnedPosition === 'end'
        ? column.table.getEndVisibleLeafColumns()
        : column.table.getCenterVisibleLeafColumns()
  const visibleDataColumnIds = visibleColumns
    .filter((candidate) => candidate.id !== tableGridSelectionColumnId)
    .map((candidate) => candidate.id)
  const columnIndex = visibleDataColumnIds.indexOf(column.id)

  return {
    left: columnIndex > 0,
    right: columnIndex >= 0 && columnIndex < visibleDataColumnIds.length - 1,
  }
}

/** Captures column-move shortcuts before Base UI interprets their arrow keys as menu navigation. */
function runColumnMoveHotkey(
  event: KeyboardEvent<HTMLDivElement>,
  column: Column<DataGridFeatures, DynamicTableRow, unknown>,
  onMove: (columnId: string, direction: ColumnMoveDirection) => void,
): void {
  if (
    event.isDefaultPrevented() === true ||
    event.nativeEvent.isComposing === true ||
    event.repeat === true
  ) {
    return
  }

  const movement = columnMoveHotkeys.find(
    ({ hotkey }) => matchesKeyboardEvent(event.nativeEvent, hotkey) === true,
  )
  if (movement === undefined) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  if (getColumnMoveAvailability(column)[movement.direction] === false) {
    return
  }

  onMove(column.id, movement.direction)
}

function MenuMoveActions({
  column,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>
  onMove: (columnId: string, direction: ColumnMoveDirection) => void
}): React.ReactElement {
  const moveAvailability = getColumnMoveAvailability(column)

  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger>Move</Menu.SubmenuTrigger>
      <Menu.Content
        side="right"
        align="start"
      >
        <Menu.Item
          disabled={moveAvailability.left === false}
          onClick={() => onMove(column.id, 'left')}
        >
          Move left
          <Menu.Shortcut hotkey={appHotkeys.moveTableColumnLeft} />
        </Menu.Item>
        <Menu.Item
          disabled={moveAvailability.right === false}
          onClick={() => onMove(column.id, 'right')}
        >
          Move right
          <Menu.Shortcut hotkey={appHotkeys.moveTableColumnRight} />
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item
          disabled={moveAvailability.left === false}
          onClick={() => onMove(column.id, 'start')}
        >
          Move to first column
        </Menu.Item>
        <Menu.Item
          disabled={moveAvailability.right === false}
          onClick={() => onMove(column.id, 'end')}
        >
          Move to last column
        </Menu.Item>
      </Menu.Content>
    </Menu.SubmenuRoot>
  )
}

function hasCustomColumnOrder(
  column: Column<DataGridFeatures, DynamicTableRow, unknown>,
  defaultColumnOrder: readonly string[],
): boolean {
  const currentColumnOrder = normalizeColumnOrder(
    column.table.options.state?.columnOrder ?? [],
    defaultColumnOrder,
  )

  return currentColumnOrder.some((columnId, index) => columnId !== defaultColumnOrder[index])
}

function MenuColumnActions({
  column,
  defaultColumnOrder,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>
  defaultColumnOrder: readonly string[]
  onMove?: (columnId: string, direction: ColumnMoveDirection) => void
}): React.ReactElement {
  const canResetColumnOrder = hasCustomColumnOrder(column, defaultColumnOrder)
  const canResetColumnWidth = column.getSize() !== column.columnDef.size
  const pinnedPosition = column.getIsPinned()

  return (
    <>
      <Menu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(false)}
      >
        Sort A to Z
      </Menu.Item>
      <Menu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(true)}
      >
        Sort Z to A
      </Menu.Item>
      <Menu.Separator />
      <Menu.Item
        disabled={column.getCanPin() === false}
        onClick={() => column.pin(pinnedPosition === false ? 'start' : false)}
      >
        {pinnedPosition === false ? 'Pin column' : 'Unpin column'}
      </Menu.Item>
      {onMove === undefined ? null : (
        <MenuMoveActions
          column={column}
          onMove={onMove}
        />
      )}
      <Menu.Separator />
      <Menu.Item
        disabled={canResetColumnOrder === false}
        onClick={() => column.table.resetColumnOrder(true)}
      >
        Reset column order
      </Menu.Item>
      <Menu.Item
        disabled={canResetColumnWidth === false}
        onClick={() => column.resetSize()}
      >
        Reset column width
      </Menu.Item>
      <Menu.Item
        disabled={column.getCanHide() === false}
        onClick={() => column.toggleVisibility(false)}
      >
        Hide column
      </Menu.Item>
    </>
  )
}

function ContextMoveActions({
  column,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>
  onMove: (columnId: string, direction: ColumnMoveDirection) => void
}): React.ReactElement {
  const moveAvailability = getColumnMoveAvailability(column)

  return (
    <ContextMenu.SubmenuRoot>
      <ContextMenu.SubmenuTrigger>Move</ContextMenu.SubmenuTrigger>
      <ContextMenu.Content
        side="right"
        align="start"
      >
        <ContextMenu.Item
          disabled={moveAvailability.left === false}
          onClick={() => onMove(column.id, 'left')}
        >
          Move left
          <ContextMenu.Shortcut hotkey={appHotkeys.moveTableColumnLeft} />
        </ContextMenu.Item>
        <ContextMenu.Item
          disabled={moveAvailability.right === false}
          onClick={() => onMove(column.id, 'right')}
        >
          Move right
          <ContextMenu.Shortcut hotkey={appHotkeys.moveTableColumnRight} />
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item
          disabled={moveAvailability.left === false}
          onClick={() => onMove(column.id, 'start')}
        >
          Move to first column
        </ContextMenu.Item>
        <ContextMenu.Item
          disabled={moveAvailability.right === false}
          onClick={() => onMove(column.id, 'end')}
        >
          Move to last column
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.SubmenuRoot>
  )
}

function ContextColumnActions({
  column,
  defaultColumnOrder,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>
  defaultColumnOrder: readonly string[]
  onMove?: (columnId: string, direction: ColumnMoveDirection) => void
}): React.ReactElement {
  const canResetColumnOrder = hasCustomColumnOrder(column, defaultColumnOrder)
  const canResetColumnWidth = column.getSize() !== column.columnDef.size
  const pinnedPosition = column.getIsPinned()

  return (
    <>
      <ContextMenu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(false)}
      >
        Sort A to Z
      </ContextMenu.Item>
      <ContextMenu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(true)}
      >
        Sort Z to A
      </ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item
        disabled={column.getCanPin() === false}
        onClick={() => column.pin(pinnedPosition === false ? 'start' : false)}
      >
        {pinnedPosition === false ? 'Pin column' : 'Unpin column'}
      </ContextMenu.Item>
      {onMove === undefined ? null : (
        <ContextMoveActions
          column={column}
          onMove={onMove}
        />
      )}
      <ContextMenu.Separator />
      <ContextMenu.Item
        disabled={canResetColumnOrder === false}
        onClick={() => column.table.resetColumnOrder(true)}
      >
        Reset column order
      </ContextMenu.Item>
      <ContextMenu.Item
        disabled={canResetColumnWidth === false}
        onClick={() => column.resetSize()}
      >
        Reset column width
      </ContextMenu.Item>
      <ContextMenu.Item
        disabled={column.getCanHide() === false}
        onClick={() => column.toggleVisibility(false)}
      >
        Hide column
      </ContextMenu.Item>
    </>
  )
}

function ColumnHeader({
  column,
  defaultColumnOrder,
  label,
  marker,
  onMenuOpen,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>
  defaultColumnOrder: readonly string[]
  label: string
  marker: ColumnTypeMarkerModel
  onMenuOpen?: (columnId: string) => void
  onMove?: (columnId: string, direction: ColumnMoveDirection) => void
}): React.ReactElement {
  const [actionsOpen, setActionsOpen] = useState(false)

  return (
    <ContextMenu.Root
      onOpenChange={(open) => {
        if (open === true) {
          setActionsOpen(false)
          onMenuOpen?.(column.id)
        }
      }}
    >
      <ContextMenu.Trigger
        render={
          <Box
            as="span"
            alignItems="center"
            display="flex"
            gap="s"
            justifyContent="between"
            minWidth={0}
            width="full"
          />
        }
      >
        <Box
          as="span"
          alignItems="center"
          display="flex"
          flex={1}
          gap="xs"
          minWidth={0}
        >
          <ColumnTypeMarker marker={marker} />
          <Text
            as="span"
            truncate
            variant="caption"
          >
            {label}
          </Text>
        </Box>
        <Menu.Root
          open={actionsOpen}
          onOpenChange={(open) => {
            setActionsOpen(open)
            if (open === true) {
              onMenuOpen?.(column.id)
            }
          }}
        >
          <Menu.Trigger
            render={
              <Button
                type="button"
                aria-label={`Open ${label} column menu`}
                glyphSize="compact"
                iconOnly
                size="xs"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                <Text
                  as="span"
                  color="muted"
                >
                  <Button.Glyph artwork={ChevronDown} />
                </Text>
              </Button>
            }
          />
          <Menu.Content
            align="end"
            onKeyDownCapture={
              onMove === undefined
                ? undefined
                : (event) => runColumnMoveHotkey(event, column, onMove)
            }
          >
            <MenuColumnActions
              column={column}
              defaultColumnOrder={defaultColumnOrder}
              onMove={onMove}
            />
          </Menu.Content>
        </Menu.Root>
      </ContextMenu.Trigger>
      <ContextMenu.Content
        onKeyDownCapture={
          onMove === undefined ? undefined : (event) => runColumnMoveHotkey(event, column, onMove)
        }
      >
        <ContextColumnActions
          column={column}
          defaultColumnOrder={defaultColumnOrder}
          onMove={onMove}
        />
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

export function buildDataGridColumns({
  columns,
  onColumnMenuOpen,
  onColumnMove,
  onRowSelectionRequest,
  onUndoRowDeletions,
}: BuildDataGridColumnsOptions): ColumnDef<DataGridFeatures, DynamicTableRow, unknown>[] {
  const defaultColumnOrder = columns.map((column) => column.id)
  const selectionColumn: ColumnDef<DataGridFeatures, DynamicTableRow, unknown> = {
    id: tableGridSelectionColumnId,
    size: 36,
    minSize: 36,
    maxSize: 36,
    enableHiding: false,
    enablePinning: false,
    enableCellSelection: false,
    enableResizing: false,
    enableSorting: false,
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      const pageRows = table.getRowModel().rows
      const allRowsDeleted =
        pageRows.length > 0 &&
        onUndoRowDeletions !== undefined &&
        pageRows.every((row) => row.getCanSelect() === false)

      return (
        <Box
          alignItems="center"
          justifyContent="center"
          width="full"
        >
          <PageSelectionControl
            allRowsDeleted={allRowsDeleted}
            checked={isAllSelected}
            indeterminate={isSomeSelected === true && isAllSelected === false}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(value)
            }}
            onUndoDeletions={
              onUndoRowDeletions === undefined
                ? undefined
                : () => onUndoRowDeletions(pageRows.map((row) => String(row.original.id)))
            }
          />
        </Box>
      )
    },
    cell: ({ row }) => {
      return (
        <Box
          alignItems="center"
          justifyContent="center"
          width="full"
        >
          <RowSelectionControl
            canSelect={row.getCanSelect()}
            checked={row.getIsSelected()}
            rowId={String(row.original.id)}
            onUndoDeletion={
              onUndoRowDeletions === undefined
                ? undefined
                : () => onUndoRowDeletions([String(row.original.id)])
            }
            onCheckedChange={(value, shiftKey) => {
              onRowSelectionRequest?.(String(row.original.id))
              row.getToggleSelectedHandler({ selectChildren: false })({
                shiftKey,
                target: { checked: value },
              })
            }}
          />
        </Box>
      )
    },
  }

  const dataColumns = columns.map<ColumnDef<DataGridFeatures, DynamicTableRow, unknown>>(
    (column) => {
      const marker = getColumnTypeMarker(column)
      const sizing = getColumnSizing(column)

      return {
        id: column.id,
        size: sizing.size,
        minSize: sizing.minSize,
        maxSize: sizing.maxSize,
        accessorFn: (row) => row[column.accessorKey],
        enableHiding: column.id !== 'id',
        enableSorting: column.isSortable,
        header: ({ column: tableColumn }) => (
          <ColumnHeader
            column={tableColumn}
            defaultColumnOrder={defaultColumnOrder}
            label={column.label}
            marker={marker}
            onMenuOpen={onColumnMenuOpen}
            onMove={onColumnMove}
          />
        ),
        cell: ({ row, table }) => {
          const { stagedValuesByRowId = {} } =
            (table.options.meta as TableGridMeta | undefined) ?? {}
          const rawValue = resolveStagedFieldValue(
            row.original,
            stagedValuesByRowId[row.id],
            column.accessorKey,
          )
          const presentation = classifySchemaValue(rawValue, column.column)

          return (
            <CompactCellValue
              isRowId={column.id === 'id' && column.column === null}
              presentation={presentation}
            />
          )
        },
      }
    },
  )

  return [selectionColumn, ...dataColumns]
}
