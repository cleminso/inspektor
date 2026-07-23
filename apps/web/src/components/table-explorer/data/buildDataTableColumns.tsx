// Defines `ColumnDef`
import type { ColumnDef } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";

import { Box, Checkbox, Text } from "@inspector/ds";

import { RelationCellLink } from "@/components/table-explorer/data/relationCellLink";
import type { TableColumnMeta } from "@/types/tableExplorer";

interface BuildDataTableColumnsOptions {
  columns: TableColumnMeta[];
}

interface ColumnSizing {
  maxSize: number;
  minSize: number;
  size: number;
}

function getColumnSizing(column: TableColumnMeta): ColumnSizing {
  if (column.id === "id" || column.column === null) {
    return { size: 224, minSize: 160, maxSize: 360 };
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

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatMiddleTruncated(value: string, maxLength = 22): string {
  if (value.length <= maxLength) {
    return value;
  }
  const sideLength = Math.floor((maxLength - 3) / 2);
  return value.slice(0, sideLength) + "..." + value.slice(-sideLength);
}

interface SelectionCheckboxProps {
  ariaLabel: string;
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SelectionCheckbox({
  ariaLabel,
  checked,
  indeterminate = false,
  onCheckedChange,
}: SelectionCheckboxProps): React.ReactElement {
  return (
    <Checkbox
      aria-label={ariaLabel}
      checked={checked}
      indeterminate={indeterminate}
      size="m"
      onCheckedChange={onCheckedChange}
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
              table.toggleAllPageRowsSelected(value === true);
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
            onCheckedChange={(value) => {
              row.toggleSelected(value === true);
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
        const relationTable = column.column?.references;

        if (relationTable !== undefined && typeof rawValue === "string" && rawValue.trim().length > 0) {
          return <RelationCellLink relationTable={relationTable} relationId={rawValue} />;
        }

        const displayValue = formatCellValue(rawValue);
        const visibleValue = column.id === "id" ? formatMiddleTruncated(displayValue) : displayValue;

        return <Text as="span" title={displayValue} truncate>{visibleValue}</Text>;
      },
    };
  });

  return [selectionColumn, ...dataColumns];
}
