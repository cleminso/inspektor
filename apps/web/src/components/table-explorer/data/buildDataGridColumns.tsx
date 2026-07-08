// Defines `ColumnDef`
import type { ColumnDef } from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { Checkbox } from "@regarde/ui/checkbox";
import { CopyPopover } from "@regarde/ui/copyPopover";

import { RelationCellLink } from "@/components/table-explorer/data/relationCellLink";
import type { TableColumnMeta, TableSortDirection } from "@/types/tableExplorer";

interface BuildDataGridColumnsOptions {
  columns: TableColumnMeta[];
  sortColumn: string;
  sortDirection: TableSortDirection;
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
      onCheckedChange={onCheckedChange}
    />
  );
}

function SortableColumnHeader({
  dataType,
  label,
  onToggleSort,
  sortDirection,
}: {
  dataType: string | null;
  label: string;
  onToggleSort?: () => void;
  sortDirection: TableSortDirection | null;
}): React.ReactElement {
  const sortIcon = sortDirection === "asc"
    ? <ChevronUp className="size-3.25" />
    : sortDirection === "desc"
      ? <ChevronDown className="size-3.25" />
      : <ChevronsUpDown className="size-3.25 opacity-60" />;

  if (onToggleSort === undefined) {
    return (
      <div className="inline-flex h-full items-center gap-1.5 text-xs/relaxed font-normal text-secondary-foreground/80">
        <span className="truncate">{label}</span>
        {dataType !== null ? <span className="text-[11px] text-muted-foreground">{dataType}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center">
      <button
        type="button"
        className="inline-flex h-6 items-center gap-1.5 rounded-xs px-0 text-left text-xs/relaxed font-normal text-secondary-foreground/80 outline-hidden transition-colors hover:bg-transparent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none"
        onClick={onToggleSort}
        aria-label={sortDirection === "asc" ? `Sort ${label} descending` : `Sort ${label} ascending`}
        aria-pressed={sortDirection !== null}
      >
        <span className="truncate">{label}</span>
        {dataType !== null ? <span className="text-[11px] text-muted-foreground">{dataType}</span> : null}
        {sortIcon}
      </button>
    </div>
  );
}

export function buildDataGridColumns({
  columns,
  sortColumn,
  sortDirection,
}: BuildDataGridColumnsOptions): ColumnDef<DynamicTableRow>[] {
  const selectionColumn: ColumnDef<DynamicTableRow> = {
    id: "_select",
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => {
      const loadedRows = table.getRowModel().rows;
      const isAllSelected = loadedRows.length > 0 && loadedRows.every((row) => row.getIsSelected() === true);
      const isSomeSelected = loadedRows.some((row) => row.getIsSelected() === true);

      return (
        <div className="flex items-center justify-center">
          <SelectionCheckbox
            checked={isAllSelected}
            indeterminate={isSomeSelected === true && isAllSelected === false}
            ariaLabel="Select all loaded rows"
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(value === true);
            }}
          />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          <SelectionCheckbox
            checked={row.getIsSelected()}
            ariaLabel={`Select row ${String(row.original.id)}`}
            onCheckedChange={(value) => {
              row.toggleSelected(value === true);
            }}
          />
        </div>
      );
    },
    meta: {
      headerClassName: "w-11",
      cellClassName: "w-11",
    },
  };

  const dataColumns = columns.map<ColumnDef<DynamicTableRow>>((column) => {
    const isActiveSort = sortColumn === column.id;
    const dataType = column.column !== null ? column.column.column_type.type.toLowerCase() : null;

    return {
      id: column.id,
      accessorFn: (row) => row[column.accessorKey],
      enableHiding: column.id !== "id",
      enableSorting: column.isSortable,
      header: ({ column: tableColumn }) => {
        const resolvedSortDirection = isActiveSort === true ? sortDirection : null;

        return (
          <SortableColumnHeader
            dataType={dataType}
            label={column.label}
            sortDirection={resolvedSortDirection}
            onToggleSort={
              column.isSortable === true
                ? () => {
                    if (resolvedSortDirection === "asc") {
                      tableColumn.toggleSorting(true);
                      return;
                    }

                    tableColumn.toggleSorting(false);
                  }
                : undefined
            }
          />
        );
      },
      cell: ({ row }) => {
        const rawValue = row.original[column.accessorKey];
        const relationTable = column.column?.references;

        if (relationTable !== undefined && typeof rawValue === "string" && rawValue.trim().length > 0) {
          return <RelationCellLink relationTable={relationTable} relationId={rawValue} />;
        }

        const displayValue = formatCellValue(rawValue);
        const columnType = column.column?.column_type.type;
        const isCopyPopoverColumn =
          column.id === "id" ||
          columnType === "Json" ||
          columnType === "Array" ||
          columnType === "Timestamp";

        if (isCopyPopoverColumn === true) {
          return (
            <CopyPopover text={displayValue}>
              <span className="block truncate">
                {column.id === "id" ? formatMiddleTruncated(displayValue) : displayValue}
              </span>
            </CopyPopover>
          );
        }

        return (
          <span className="block truncate" title={displayValue}>
            {displayValue}
          </span>
        );
      },
      // TODO: any way to do better?
      meta: {
        headerTitle: column.label,
        headerClassName: column.id === "id" ? "min-w-40" : undefined,
        cellClassName: "max-w-40 truncate",
      },
    };
  });

  return [selectionColumn, ...dataColumns];
}
