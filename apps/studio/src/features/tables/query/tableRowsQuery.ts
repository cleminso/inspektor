import type { WasmSchema } from 'jazz-tools'

import type { TableFilterClause } from '@tables/filters/tableFilters'
import { filterTableFilterClauses } from '@tables/filters/filterParsing'
import { GenericQueryBuilder } from '@tables/query/genericQueryBuilder'
import { getTableColumns } from '@tables/schema/tableSchema'
import {
  TABLE_PROVENANCE_COLUMN_NAMES,
  type TableProvenanceColumnName,
} from '@tables/tableProvenance'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'

interface BuildTableRowsQueryOptions {
  filters: readonly TableFilterClause[]
  page: number
  pageSize: TablePageSize
  schema: WasmSchema
  sortColumn: string
  sortDirection: TableSortDirection
  tableName: string
}

/** Jazz can order provenance timestamps but rejects ordering by root author objects. */
export const TABLE_SORTABLE_PROVENANCE_COLUMN_NAMES = ['$createdAt', '$updatedAt'] as const

export function isTableProvenanceColumnName(
  columnName: string,
): columnName is TableProvenanceColumnName {
  return TABLE_PROVENANCE_COLUMN_NAMES.some((name) => name === columnName)
}

export function isTableSortableProvenanceColumnName(
  columnName: string,
): columnName is (typeof TABLE_SORTABLE_PROVENANCE_COLUMN_NAMES)[number] {
  return TABLE_SORTABLE_PROVENANCE_COLUMN_NAMES.some((name) => name === columnName)
}

/** Restricts runtime sorting to column types supported by Jazz ordering. */
export function isTableColumnSortable(
  columnType: ReturnType<typeof getTableColumns>[number]['column_type'],
): boolean {
  switch (columnType.type) {
    case 'Integer':
    case 'BigInt':
    case 'Double':
    case 'Boolean':
    case 'Text':
    case 'Enum':
    case 'Timestamp':
    case 'Uuid':
      return true
    default:
      return false
  }
}

export function resolveTableSortColumn(
  columns: ReturnType<typeof getTableColumns>,
  sortColumn: string,
): string {
  return sortColumn === 'id' ||
    isTableSortableProvenanceColumnName(sortColumn) === true ||
    columns.some(
      (column) => column.name === sortColumn && isTableColumnSortable(column.column_type),
    )
    ? sortColumn
    : 'id'
}

/**
 * Builds a schema-driven Jazz query for an arbitrary inspected table.
 *
 * The extra result is a pagination probe: `useTableRows` renders at most `pageSize` rows
 * and uses the additional row only to derive whether more data can be requested.
 */
export function buildTableRowsQuery({
  filters,
  page,
  pageSize,
  schema,
  sortColumn,
  sortDirection,
  tableName,
}: BuildTableRowsQueryOptions): GenericQueryBuilder {
  const applicableFilters = filterTableFilterClauses({ filters, schema, tableName })
  const resolvedSortColumn = resolveTableSortColumn(getTableColumns(schema, tableName), sortColumn)
  const resolvedSortDirection =
    resolvedSortColumn === 'id' && sortColumn !== 'id' ? 'asc' : sortDirection
  let builder = new GenericQueryBuilder(tableName, schema).select(
    '*',
    ...TABLE_PROVENANCE_COLUMN_NAMES,
  )
  for (const filter of applicableFilters) {
    builder = builder.where({ [filter.column]: { [filter.operator]: filter.value } })
  }

  builder = builder.orderBy(resolvedSortColumn, resolvedSortDirection)
  if (resolvedSortColumn !== 'id') {
    builder = builder.orderBy('id', 'asc')
  }

  return builder.limit(pageSize + 1).offset((page - 1) * pageSize)
}
