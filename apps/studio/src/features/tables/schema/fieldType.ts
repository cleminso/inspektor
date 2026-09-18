import type { ColumnType } from 'jazz-tools'

export function isStructuredColumnType(columnType: ColumnType): boolean {
  return columnType.type === 'Json' || columnType.type === 'Array' || columnType.type === 'Row'
}

export function getEmptyStructuredValueText(columnType: ColumnType): string | null {
  if (columnType.type === 'Array') {
    return '[]'
  }
  return columnType.type === 'Json' || columnType.type === 'Row' ? '{}' : null
}
