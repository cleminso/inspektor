// Defines `ColumnDef`
import { useRef, type MouseEvent } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";

import { BinaryValue, Box, Checkbox, StructuredValuePreview, Text, TimestampValue } from "@inspector/ds";

import { RelationCellLink } from "@/components/table-explorer/data/relationCellLink";
import {
  classifySchemaValue,
  type SchemaValuePresentation,
} from "@/lib/table-explorer/schemaValuePresentation";
import type { TableColumnMeta } from "@/types/tableExplorer";

interface BuildDataTableColumnsOptions {
  columns: TableColumnMeta[];
  onRowSelectionRequest?: (request: RowSelectionRequest) => void;
}

export interface RowSelectionRequest {
  checked: boolean;
  rowId: string;
  shiftKey: boolean;
}

interface ColumnSizing {
  maxSize: number;
  minSize: number;
  size: number;
}

function getColumnSizing(column: TableColumnMeta): ColumnSizing {
  if (column.id === "id" || column.column === null) {
    return { size: 320, minSize: 160, maxSize: 480 };
  }

  if (column.column.references !== undefined) {
    return { size: 240, minSize: 160, maxSize: 480 };
  }

  switch (column.column.column_type.type) {
    case "Boolean":
      return { size: 96, minSize: 72, maxSize: 120 };
    case "Integer":
    case "BigInt":
    case "Double":
      return { size: 120, minSize: 88, maxSize: 180 };
    case "Timestamp":
      return { size: 180, minSize: 144, maxSize: 260 };
    case "Uuid":
      return { size: 220, minSize: 160, maxSize: 360 };
    case "Json":
    case "Array":
    case "Row":
      return { size: 320, minSize: 200, maxSize: 640 };
    case "Enum":
      return { size: 160, minSize: 120, maxSize: 320 };
    case "Bytea":
      return { size: 200, minSize: 144, maxSize: 480 };
    case "Text":
    default:
      return { size: 220, minSize: 120, maxSize: 480 };
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
        aria-label={presentation.displayValue}
        data-cell-overflow="truncate"
        truncate
      >
        {presentation.displayValue}
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
        <Text as="span" aria-label={`Boolean ${String(presentation.value)}`} color="muted">
        </Text>
        <Text as="span">{String(presentation.value)}</Text>
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
      truncate
    >
      {presentation.displayValue}
    </Text>
  );
}

interface SelectionCheckboxProps {
  ariaLabel: string;
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean, shiftKey: boolean) => void;
}

function SelectionCheckbox({
  ariaLabel,
  checked,
  indeterminate = false,
  onCheckedChange,
}: SelectionCheckboxProps): React.ReactElement {
  const shiftKeyRef = useRef(false);

  return (
    <Checkbox
      aria-label={ariaLabel}
      checked={checked}
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

function ColumnHeader({
  dataType,
  label,
}: {
  dataType: string | null;
  label: string;
}): React.ReactElement {
  return (
    <Box as="span" alignItems="center" gap="s" minWidth={0}>
      <Text as="span" truncate variant="caption">{label}</Text>
      {dataType !== null ? <Text as="span" color="muted" variant="caption">{dataType}</Text> : null}
    </Box>
  );
}

export function buildDataTableColumns({
  columns,
  onRowSelectionRequest,
}: BuildDataTableColumnsOptions): ColumnDef<DynamicTableRow>[] {
  const selectionColumn: ColumnDef<DynamicTableRow> = {
    id: "_select",
    size: 36,
    minSize: 36,
    maxSize: 36,
    enableHiding: false,
    enableResizing: false,
    enableSorting: false,
    header: ({ table }) => {
      const loadedRows = table.getRowModel().rows;
      const isAllSelected = loadedRows.length > 0 && loadedRows.every((row) => row.getIsSelected() === true);
      const isSomeSelected = loadedRows.some((row) => row.getIsSelected() === true);

      return (
        <Box alignItems="center" justifyContent="center">
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
          <SelectionCheckbox
            checked={row.getIsSelected()}
            ariaLabel={`Select row ${String(row.original.id)}`}
            onCheckedChange={(value, shiftKey) => {
              if (onRowSelectionRequest !== undefined) {
                onRowSelectionRequest({
                  checked: value,
                  rowId: String(row.original.id),
                  shiftKey,
                });
                return;
              }

              row.toggleSelected(value);
            }}
          />
        </Box>
      );
    },
  };

  const dataColumns = columns.map<ColumnDef<DynamicTableRow>>((column) => {
    const dataType = column.column !== null ? column.column.column_type.type.toLowerCase() : null;
    const sizing = getColumnSizing(column);

    return {
      id: column.id,
      size: sizing.size,
      minSize: sizing.minSize,
      maxSize: sizing.maxSize,
      accessorFn: (row) => row[column.accessorKey],
      enableHiding: column.id !== "id",
      enableSorting: column.isSortable,
      header: () => <ColumnHeader dataType={dataType} label={column.label} />,
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
  });

  return [selectionColumn, ...dataColumns];
}
