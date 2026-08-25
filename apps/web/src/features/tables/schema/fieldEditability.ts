import type { ColumnDescriptor, ColumnType } from 'jazz-tools'

export type FieldReadOnlyReason = 'binary' | null

function isBinaryColumnType(columnType: ColumnType): boolean {
  if (columnType.type === 'Bytea') {
    return true
  }
  if (columnType.type === 'Array') {
    return isBinaryColumnType(columnType.element)
  }
  if (columnType.type === 'Row') {
    return columnType.columns.some((column) => isBinaryColumnType(column.column_type))
  }
  return false
}

export function getFieldReadOnlyReason(column: ColumnDescriptor): FieldReadOnlyReason {
  return isBinaryColumnType(column.column_type) === true ? 'binary' : null
}
