import { useEffect, useRef, type MouseEvent, type Ref } from "react";

import type { Column, ColumnDef } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { ChevronDown, KeyRound, Undo2 } from "lucide-react";

import {
  BinaryValue,
  Box,
  Checkbox,
  ContextMenu,
  Button,
  KeyboardInput,
  Menu,
  MiddleTruncate,
  StructuredValuePreview,
  Text,
  TimestampValue,
  Tooltip,
  Icon,
  type DataGridFeatures,
} from "@inspector/ds";

import { productGlyphs } from "@app/icons/productGlyphs";
import {
  getColumnTypeMarker,
  type ColumnTypeMarker as ColumnTypeMarkerModel,
} from "@tables/grid/columnTypeMarker";
import { RelationCellLink } from "@tables/grid/relationCellLink";
import { tableGridSelectionColumnId } from "@tables/grid/tableGridColumnIds";
import { classifySchemaValue, type SchemaValuePresentation } from "@tables/grid/valuePresentation";
import type { ColumnMoveDirection } from "@tables/grid/useColumnOrder";
import type { TableColumnMeta } from "@tables/tableTypes";

interface BuildDataGridColumnsOptions {
  columns: TableColumnMeta[];
  onColumnMenuOpen?: (columnId: string) => void;
  onColumnMove?: (columnId: string, direction: ColumnMoveDirection) => void;
  onRowSelectionRequest?: (request: RowSelectionRequest) => void;
  onUndoRowDeletion?: (rowId: string) => void;
}

export interface RowSelectionRequest {
  checked: boolean;
  rowId: string;
  shiftKey: boolean;
}

interface ColumnSizing {
  maxSize?: number;
  minSize: number;
  size: number;
}

function getColumnSizing(column: TableColumnMeta): ColumnSizing {
  if (column.id === "id" || column.column === null) {
    return { size: 294, minSize: 154 };
  }

  if (column.column.references !== undefined) {
    return { size: 310, minSize: 170 };
  }

  switch (column.column.column_type.type) {
    case "Boolean":
      return { size: 220, minSize: 120 };
    case "Integer":
    case "BigInt":
    case "Double":
      return { size: 220, minSize: 120 };
    case "Timestamp":
      return { size: 210, minSize: 114 };
    case "Uuid":
      return { size: 220, minSize: 156 };
    case "Json":
      return { size: 220, minSize: 160 };
    case "Array":
      return { size: 220, minSize: 160 };
    case "Row":
      return { size: 220, minSize: 160 };
    case "Enum":
      return { size: 160, minSize: 120 };
    case "Bytea":
      return { size: 144, minSize: 144 };
    case "Text":
    default:
      return { size: 280, minSize: 120 };
  }
}

function CompactCellValue({
  isRowId,
  presentation,
}: {
  isRowId: boolean;
  presentation: SchemaValuePresentation;
}): React.ReactElement {
  if (presentation.kind === "relation") {
    return (
      <RelationCellLink
        relationTable={presentation.relationTable}
        relationId={presentation.relationId}
      />
    );
  }

  if (presentation.kind === "bytes") {
    return <BinaryValue byteLength={presentation.byteLength} />;
  }

  if (presentation.kind === "timestamp") {
    return <TimestampValue value={presentation.epochMilliseconds} />;
  }

  if (presentation.kind === "structured") {
    return <StructuredValuePreview model={presentation.model} variant={presentation.variant} />;
  }

  if (isRowId === true && "displayValue" in presentation) {
    return (
      <Text
        as="span"
        data-cell-overflow="middle-truncate"
        data-cell-typography="mono"
        monospace
      >
        <MiddleTruncate value={presentation.displayValue} />
      </Text>
    );
  }

  if (presentation.kind === "number") {
    return (
      <Box justifyContent="end" width="full">
        <Text
          as="span"
          align="right"
          data-cell-alignment="end"
          data-cell-typography="mono"
          data-numeric-variant="tabular"
          monospace
          tabularNums
          truncate
        >
          {presentation.displayValue}
        </Text>
      </Box>
    );
  }

  if (presentation.kind === "boolean") {
    return (
      <Box as="span" alignItems="center" gap="xs">
        <Text as="span" aria-label={`Boolean ${String(presentation.value)}`} color="muted"></Text>
        <Text as="span" data-cell-typography="mono" monospace>
          {String(presentation.value)}
        </Text>
      </Box>
    );
  }

  const isSubdued = presentation.kind === "null" || presentation.kind === "unavailable";
  return (
    <Text
      as="span"
      color={
        presentation.kind === "unsupported" || presentation.kind === "invalid"
          ? "danger"
          : isSubdued === true
            ? "muted"
            : undefined
      }
      data-cell-overflow="truncate"
      data-cell-typography="mono"
      monospace
      truncate
    >
      {presentation.displayValue}
    </Text>
  );
}

interface SelectionCheckboxProps {
  ariaLabel: string;
  checked: boolean;
  checkboxRef?: Ref<HTMLElement>;
  disabled?: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean, shiftKey: boolean) => void;
}

function SelectionCheckbox({
  ariaLabel,
  checked,
  checkboxRef,
  disabled = false,
  indeterminate = false,
  onCheckedChange,
}: SelectionCheckboxProps): React.ReactElement {
  const shiftKeyRef = useRef(false);

  return (
    <Checkbox
      ref={checkboxRef}
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      indeterminate={indeterminate}
      size="m"
      onClickCapture={(event: MouseEvent<HTMLElement>) => {
        shiftKeyRef.current = event.shiftKey;
      }}
      onCheckedChange={(nextChecked: boolean) => {
        onCheckedChange(nextChecked === true, shiftKeyRef.current);
        shiftKeyRef.current = false;
      }}
    />
  );
}

interface RowSelectionControlProps {
  canSelect: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean, shiftKey: boolean) => void;
  onUndoDeletion?: () => void;
  rowId: string;
}

function RowSelectionControl({
  canSelect,
  checked,
  onCheckedChange,
  onUndoDeletion,
  rowId,
}: RowSelectionControlProps): React.ReactElement {
  const checkboxRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (canSelect === true && restoreFocusRef.current === true) {
      restoreFocusRef.current = false;
      checkboxRef.current?.focus();
    }
  }, [canSelect]);

  if (canSelect === false && onUndoDeletion !== undefined) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Button
              type="button"
              aria-label={`Undo deletion for row ${rowId}`}
              glyphSize="compact"
              iconOnly
              size="xs"
              variant="ghost"
              onClick={() => {
                restoreFocusRef.current = true;
                onUndoDeletion();
              }}
            >
              <Button.Glyph artwork={Undo2} />
            </Button>
          }
        />
        <Tooltip.Content>Undo deletion</Tooltip.Content>
      </Tooltip.Root>
    );
  }

  return (
    <SelectionCheckbox
      ariaLabel={`Select row ${rowId}`}
      checked={checked}
      checkboxRef={checkboxRef}
      disabled={canSelect === false}
      onCheckedChange={onCheckedChange}
    />
  );
}

function ColumnTypeMarker({ marker }: { marker: ColumnTypeMarkerModel }): React.ReactElement {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Text as="span" color="muted" variant="caption">
            <Box as="span" alignItems="center" display="flex">
              {marker.icon === "key" ? <Icon artwork={KeyRound} size="xs" /> : null}
              {marker.icon === "relation" ? (
                <Icon artwork={productGlyphs.relation} size="xs" />
              ) : null}
              {marker.suffix}
            </Box>
          </Text>
        }
      />
      <Tooltip.Content>{marker.label}</Tooltip.Content>
    </Tooltip.Root>
  );
}

export function ColumnDragPreview({ column }: { column: TableColumnMeta }): React.ReactElement {
  return (
    <Box as="span" alignItems="center" display="flex" gap="xxs" minWidth={0}>
      <ColumnTypeMarker marker={getColumnTypeMarker(column)} />
      <Text as="span" truncate variant="caption">
        {column.label}
      </Text>
    </Box>
  );
}

function MenuMoveActions({
  columnId,
  onMove,
}: {
  columnId: string;
  onMove: (columnId: string, direction: ColumnMoveDirection) => void;
}): React.ReactElement {
  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger>Move</Menu.SubmenuTrigger>
      <Menu.Content side="right" align="start">
        <Menu.Item onClick={() => onMove(columnId, "left")}>
          Move left
          <Menu.Shortcut>
            <KeyboardInput modifiers={["shift"]} size="small">
              ←
            </KeyboardInput>
          </Menu.Shortcut>
        </Menu.Item>
        <Menu.Item onClick={() => onMove(columnId, "right")}>
          Move right
          <Menu.Shortcut>
            <KeyboardInput modifiers={["shift"]} size="small">
              →
            </KeyboardInput>
          </Menu.Shortcut>
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item onClick={() => onMove(columnId, "start")}>Move to start</Menu.Item>
        <Menu.Item onClick={() => onMove(columnId, "end")}>Move to end</Menu.Item>
      </Menu.Content>
    </Menu.SubmenuRoot>
  );
}

function MenuColumnActions({
  column,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>;
  onMove?: (columnId: string, direction: ColumnMoveDirection) => void;
}): React.ReactElement {
  return (
    <>
      <Menu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(false)}
      >
        Sort Ascending
      </Menu.Item>
      <Menu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(true)}
      >
        Sort Descending
      </Menu.Item>
      {onMove === undefined ? null : (
        <>
          <Menu.Separator />
          <MenuMoveActions columnId={column.id} onMove={onMove} />
        </>
      )}
      <Menu.Separator />
      <Menu.Item onClick={() => column.resetSize()}>Reset column width</Menu.Item>
      <Menu.Item
        disabled={column.getCanHide() === false}
        onClick={() => column.toggleVisibility(false)}
      >
        Hide column
      </Menu.Item>
    </>
  );
}

function ContextMoveActions({
  columnId,
  onMove,
}: {
  columnId: string;
  onMove: (columnId: string, direction: ColumnMoveDirection) => void;
}): React.ReactElement {
  return (
    <ContextMenu.SubmenuRoot>
      <ContextMenu.SubmenuTrigger>Move</ContextMenu.SubmenuTrigger>
      <ContextMenu.Content side="right" align="start">
        <ContextMenu.Item onClick={() => onMove(columnId, "left")}>
          Move left
          <ContextMenu.Shortcut>
            <KeyboardInput modifiers={["shift"]} size="small">
              ←
            </KeyboardInput>
          </ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => onMove(columnId, "right")}>
          Move right
          <ContextMenu.Shortcut>
            <KeyboardInput modifiers={["shift"]} size="small">
              →
            </KeyboardInput>
          </ContextMenu.Shortcut>
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={() => onMove(columnId, "start")}>Move to start</ContextMenu.Item>
        <ContextMenu.Item onClick={() => onMove(columnId, "end")}>Move to end</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.SubmenuRoot>
  );
}

function ContextColumnActions({
  column,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>;
  onMove?: (columnId: string, direction: ColumnMoveDirection) => void;
}): React.ReactElement {
  return (
    <>
      <ContextMenu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(false)}
      >
        Sort Ascending
      </ContextMenu.Item>
      <ContextMenu.Item
        disabled={column.getCanSort() === false}
        onClick={() => column.toggleSorting(true)}
      >
        Sort Descending
      </ContextMenu.Item>
      {onMove === undefined ? null : (
        <>
          <ContextMenu.Separator />
          <ContextMoveActions columnId={column.id} onMove={onMove} />
        </>
      )}
      <ContextMenu.Separator />
      <ContextMenu.Item onClick={() => column.resetSize()}>Reset column width</ContextMenu.Item>
      <ContextMenu.Item
        disabled={column.getCanHide() === false}
        onClick={() => column.toggleVisibility(false)}
      >
        Hide column
      </ContextMenu.Item>
    </>
  );
}

function ColumnHeader({
  column,
  label,
  marker,
  onMenuOpen,
  onMove,
}: {
  column: Column<DataGridFeatures, DynamicTableRow, unknown>;
  label: string;
  marker: ColumnTypeMarkerModel;
  onMenuOpen?: (columnId: string) => void;
  onMove?: (columnId: string, direction: ColumnMoveDirection) => void;
}): React.ReactElement {
  const handleOpenChange = (open: boolean) => {
    if (open === true) {
      onMenuOpen?.(column.id);
    }
  };

  return (
    <ContextMenu.Root onOpenChange={handleOpenChange}>
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
        <Box as="span" alignItems="center" display="flex" flex={1} gap="xs" minWidth={0}>
          <ColumnTypeMarker marker={marker} />
          <Text as="span" truncate variant="caption">
            {label}
          </Text>
        </Box>
        <Menu.Root onOpenChange={handleOpenChange}>
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
                  event.stopPropagation();
                }}
              >
                <Text as="span" color="muted">
                  <Button.Glyph artwork={ChevronDown} />
                </Text>
              </Button>
            }
          />
          <Menu.Content align="end">
            <MenuColumnActions column={column} onMove={onMove} />
          </Menu.Content>
        </Menu.Root>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextColumnActions column={column} onMove={onMove} />
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}

export function buildDataGridColumns({
  columns,
  onColumnMenuOpen,
  onColumnMove,
  onRowSelectionRequest,
  onUndoRowDeletion,
}: BuildDataGridColumnsOptions): ColumnDef<DataGridFeatures, DynamicTableRow, unknown>[] {
  const selectionColumn: ColumnDef<DataGridFeatures, DynamicTableRow, unknown> = {
    id: tableGridSelectionColumnId,
    size: 36,
    minSize: 36,
    maxSize: 36,
    enableHiding: false,
    enableCellSelection: false,
    enableResizing: false,
    enableSorting: false,
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();

      return (
        <Box alignItems="center" justifyContent="center" width="full">
          <SelectionCheckbox
            checked={isAllSelected}
            indeterminate={isSomeSelected === true && isAllSelected === false}
            ariaLabel="Select all loaded rows"
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(value);
            }}
          />
        </Box>
      );
    },
    cell: ({ row }) => {
      return (
        <Box alignItems="center" justifyContent="center" width="full">
          <RowSelectionControl
            canSelect={row.getCanSelect()}
            checked={row.getIsSelected()}
            rowId={String(row.original.id)}
            onUndoDeletion={
              onUndoRowDeletion === undefined
                ? undefined
                : () => onUndoRowDeletion(String(row.original.id))
            }
            onCheckedChange={(value, shiftKey) => {
              onRowSelectionRequest?.({
                checked: value,
                rowId: String(row.original.id),
                shiftKey,
              });
              row.getToggleSelectedHandler({ selectChildren: false })({
                shiftKey,
                target: { checked: value },
              });
            }}
          />
        </Box>
      );
    },
  };

  const dataColumns = columns.map<ColumnDef<DataGridFeatures, DynamicTableRow, unknown>>(
    (column) => {
      const marker = getColumnTypeMarker(column);
      const sizing = getColumnSizing(column);

      return {
        id: column.id,
        size: sizing.size,
        minSize: sizing.minSize,
        maxSize: sizing.maxSize,
        accessorFn: (row) => row[column.accessorKey],
        enableHiding: column.id !== "id",
        enableSorting: column.isSortable,
        header: ({ column: tableColumn }) => (
          <ColumnHeader
            column={tableColumn}
            label={column.label}
            marker={marker}
            onMenuOpen={onColumnMenuOpen}
            onMove={onColumnMove}
          />
        ),
        cell: ({ row }) => {
          const rawValue = row.original[column.accessorKey];
          const presentation = classifySchemaValue(rawValue, column.column);

          return (
            <CompactCellValue
              isRowId={column.id === "id" && column.column === null}
              presentation={presentation}
            />
          );
        },
      };
    },
  );

  return [selectionColumn, ...dataColumns];
}
