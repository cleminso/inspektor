import { useMemo, useState } from "react";

import type { ColumnDescriptor, ColumnType } from "jazz-tools";
import { X } from "lucide-react";

import { Button } from "@regarde/ui/button";
import { Input } from "@regarde/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@regarde/ui/select";

import {
  createFilterClauseId,
  getFilterOperatorsForColumn,
  parseFilterValue,
} from "@/lib/table-explorer/filterParsing";
import type { TableFilterClause, TableFilterOperator } from "@/types/tableFilters";

interface TableFilterProps {
  filters: TableFilterClause[];
  onClear: () => void;
  onFiltersChange: (filters: TableFilterClause[]) => void | Promise<void>;
  onRequestClose: () => void;
  schemaColumns: ColumnDescriptor[];
}

interface FilterableColumn {
  columnType: ColumnType;
  name: string;
  nullable: boolean;
  operators: TableFilterOperator[];
}

interface DraftFilterRow {
  column: string;
  id: string;
  operator: TableFilterOperator;
  valueText: string;
}

const ID_COLUMN_TYPE: ColumnType = { type: "Text" };
const OPERATOR_LABELS: Record<TableFilterOperator, string> = {
  eq: "equals",
  ne: "not equals",
  gt: "greater than",
  gte: "greater or equal",
  lt: "less than",
  lte: "less or equal",
  contains: "contains",
  in: "in",
  isNull: "is null",
};

function getDefaultValueText(column: FilterableColumn, operator: TableFilterOperator): string {
  if (operator === "isNull" || column.columnType.type === "Boolean") {
    return "true";
  }

  return "";
}

function createDraftRow(column: FilterableColumn): DraftFilterRow {
  const operator = column.operators[0] ?? "eq";

  return {
    id: createFilterClauseId(),
    column: column.name,
    operator,
    valueText: getDefaultValueText(column, operator),
  };
}

function stringifyFilterValue(value: unknown, operator: TableFilterOperator): string {
  if (operator === "in" && Array.isArray(value) === true) {
    return value.map((item) => stringifyFilterValue(item, "eq")).join(", ");
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Uint8Array) {
    return Array.from(value).join(", ");
  }
  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

function createDraftRowsFromFilters(
  filters: TableFilterClause[],
  filterableColumns: FilterableColumn[],
): DraftFilterRow[] {
  const rows = filters
    .map((filter) => {
      const column = filterableColumns.find((candidate) => candidate.name === filter.column) ?? null;
      if (column === null || column.operators.includes(filter.operator) === false) {
        return null;
      }

      return {
        id: filter.id,
        column: filter.column,
        operator: filter.operator,
        valueText: stringifyFilterValue(filter.value, filter.operator),
      };
    })
    .filter((row): row is DraftFilterRow => row !== null);

  if (rows.length > 0) {
    return rows;
  }

  const firstColumn = filterableColumns[0] ?? null;
  return firstColumn === null ? [] : [createDraftRow(firstColumn)];
}

function areFiltersEqual(left: TableFilterClause[], right: TableFilterClause[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseDraftRows(
  rows: DraftFilterRow[],
  filterableColumns: FilterableColumn[],
): { filters: TableFilterClause[]; errors: Record<string, string> } {
  const filters: TableFilterClause[] = [];
  const errors: Record<string, string> = {};

  for (const row of rows) {
    const column = filterableColumns.find((candidate) => candidate.name === row.column) ?? null;
    if (column === null) {
      errors[row.id] = "Unknown column.";
      continue;
    }
    if (column.operators.includes(row.operator) === false) {
      errors[row.id] = "Unsupported operator.";
      continue;
    }

    const isRequiredValueMissing = row.operator !== "isNull" && row.valueText.trim().length === 0;
    if (isRequiredValueMissing === true) {
      continue;
    }

    try {
      filters.push({
        id: row.id,
        column: row.column,
        operator: row.operator,
        value: parseFilterValue(
          {
            column_type: column.columnType,
            nullable: column.nullable,
          },
          row.operator,
          row.valueText,
        ),
      });
    } catch (error) {
      errors[row.id] = error instanceof Error ? error.message : "Invalid filter value.";
    }
  }

  return { filters, errors };
}

export function TableFilter({
  filters,
  onClear,
  onFiltersChange,
  onRequestClose,
  schemaColumns,
}: TableFilterProps): React.ReactElement {
  const filterableColumns = useMemo<FilterableColumn[]>(() => {
    const idColumn: FilterableColumn = {
      name: "id",
      columnType: ID_COLUMN_TYPE,
      nullable: false,
      operators: ["eq", "ne", "in"],
    };

    return [
      idColumn,
      ...schemaColumns
        .map((column) => ({
          name: column.name,
          columnType: column.column_type,
          nullable: column.nullable,
          operators: getFilterOperatorsForColumn(column),
        }))
        .filter((column) => column.operators.length > 0),
    ];
  }, [schemaColumns]);
  const draftKey = useMemo(
    () => JSON.stringify({ filters, columns: filterableColumns.map((column) => [column.name, column.operators]) }),
    [filterableColumns, filters],
  );

  return (
    <TableFilterDraft
      key={draftKey}
      filterableColumns={filterableColumns}
      filters={filters}
      onClear={onClear}
      onFiltersChange={onFiltersChange}
      onRequestClose={onRequestClose}
    />
  );
}

interface TableFilterDraftProps extends Omit<TableFilterProps, "schemaColumns"> {
  filterableColumns: FilterableColumn[];
}

function TableFilterDraft({
  filterableColumns,
  filters,
  onClear,
  onFiltersChange,
  onRequestClose,
}: TableFilterDraftProps): React.ReactElement {
  const [rows, setRows] = useState<DraftFilterRow[]>(() => createDraftRowsFromFilters(filters, filterableColumns));
  const parsedRows = useMemo(() => parseDraftRows(rows, filterableColumns), [filterableColumns, rows]);

  const commitRows = (nextRows: DraftFilterRow[]) => {
    setRows(nextRows);

    const nextParsedRows = parseDraftRows(nextRows, filterableColumns);
    if (areFiltersEqual(nextParsedRows.filters, filters) === false) {
      void onFiltersChange(nextParsedRows.filters);
    }
  };

  const updateRow = (rowId: string, nextRow: DraftFilterRow) => {
    commitRows(rows.map((row) => (row.id === rowId ? nextRow : row)));
  };

  const removeRow = (rowId: string) => {
    const nextRows = rows.filter((candidate) => candidate.id !== rowId);
    if (nextRows.length === 0) {
      commitRows([]);
      onRequestClose();
      return;
    }

    commitRows(nextRows);
  };

  return (
    <div className="shrink-0 border-b border-border bg-background px-3 py-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          {rows.map((row, index) => {
            const selectedColumn = filterableColumns.find((column) => column.name === row.column) ?? null;
            const operators = selectedColumn?.operators ?? [];
            const error = parsedRows.errors[row.id] ?? null;
            const usesBooleanSelect = row.operator === "isNull" || selectedColumn?.columnType.type === "Boolean";
            const enumVariants = selectedColumn?.columnType.type === "Enum" ? selectedColumn.columnType.variants : null;
            const rowLabel = `Filter ${index + 1}`;

            return (
              <div key={row.id} className="flex flex-wrap items-start gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-0.5"
                  aria-label={`Remove ${rowLabel.toLowerCase()}`}
                  onClick={() => {
                    removeRow(row.id);
                  }}
                >
                  <X />
                </Button>
                <Select
                  value={row.column}
                  onValueChange={(nextValue) => {
                    if (typeof nextValue !== "string") {
                      return;
                    }

                    const nextColumn = filterableColumns.find((column) => column.name === nextValue) ?? null;
                    if (nextColumn === null) {
                      return;
                    }

                    const nextOperator = nextColumn.operators[0] ?? "eq";
                    updateRow(row.id, {
                      ...row,
                      column: nextColumn.name,
                      operator: nextOperator,
                      valueText: getDefaultValueText(nextColumn, nextOperator),
                    });
                  }}
                >
                  <SelectTrigger density="lg" className="w-36" aria-label={`${rowLabel} column`}>
                    <SelectValue placeholder="column" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterableColumns.map((column) => (
                      <SelectItem key={column.name} value={column.name}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={row.operator}
                  onValueChange={(nextValue) => {
                    if (typeof nextValue !== "string") {
                      return;
                    }
                    if (operators.includes(nextValue as TableFilterOperator) === false || selectedColumn === null) {
                      return;
                    }

                    const nextOperator = nextValue as TableFilterOperator;
                    updateRow(row.id, {
                      ...row,
                      operator: nextOperator,
                      valueText: getDefaultValueText(selectedColumn, nextOperator),
                    });
                  }}
                >
                  <SelectTrigger density="lg" className="w-36" aria-label={`${rowLabel} operator`}>
                    <SelectValue placeholder="operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {OPERATOR_LABELS[operator]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex w-64 flex-col gap-1">
                  {usesBooleanSelect === true ? (
                    <Select
                      value={row.valueText}
                      onValueChange={(nextValue) => {
                        if (typeof nextValue !== "string") {
                          return;
                        }

                        updateRow(row.id, { ...row, valueText: nextValue });
                      }}
                    >
                      <SelectTrigger
                        density="lg"
                        className="w-full"
                        aria-invalid={error !== null}
                        aria-label={`${rowLabel} value`}
                      >
                        <SelectValue placeholder="value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : enumVariants !== null ? (
                    <Select
                      value={row.valueText}
                      onValueChange={(nextValue) => {
                        if (typeof nextValue !== "string") {
                          return;
                        }

                        updateRow(row.id, { ...row, valueText: nextValue });
                      }}
                    >
                      <SelectTrigger
                        density="lg"
                        className="w-full"
                        aria-invalid={error !== null}
                        aria-label={`${rowLabel} value`}
                      >
                        <SelectValue placeholder="value" />
                      </SelectTrigger>
                      <SelectContent>
                        {enumVariants.map((variant) => (
                          <SelectItem key={variant} value={variant}>
                            {variant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={row.valueText}
                      placeholder="value"
                      aria-invalid={error !== null}
                      aria-label={`${rowLabel} value`}
                      density="default"
                      onChange={(event) => {
                        updateRow(row.id, { ...row, valueText: event.currentTarget.value });
                      }}
                    />
                  )}
                  {error !== null ? <span className="text-xs text-destructive">{error}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="default" onClick={onClear}>
            Clear
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            disabled={filterableColumns.length === 0}
            onClick={() => {
              const firstColumn = filterableColumns[0] ?? null;
              if (firstColumn === null) {
                return;
              }

              commitRows([...rows, createDraftRow(firstColumn)]);
            }}
          >
            Add filter
          </Button>
        </div>
      </div>
    </div>
  );
}
