interface DataExportColumn {
  accessorKey: string
  label: string
}

export type DataExportFormat = 'csv' | 'json' | 'ndjson'

const csvEscapePattern = /[",\r\n]/u
const csvQuotePattern = /"/gu

function normalizeJsonValue(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return String(value)
  }
  return value === undefined ? null : value
}

function escapeCsvCell(value: string): string {
  return csvEscapePattern.test(value) === true ? `"${value.replace(csvQuotePattern, '""')}"` : value
}

function serializeCsvValue(value: unknown): string {
  if (value === null) {
    return 'NULL'
  }
  if (value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return typeof value === 'object'
    ? (JSON.stringify(value, normalizeJsonValue) ?? 'null')
    : String(value)
}

export function createDataExport(
  format: DataExportFormat,
  columns: readonly DataExportColumn[],
  rows: readonly Readonly<Record<string, unknown>>[],
): string {
  if (format === 'csv') {
    const header = columns.map((column) => escapeCsvCell(column.label)).join(',')
    const data = rows.map((row) =>
      columns.map((column) => escapeCsvCell(serializeCsvValue(row[column.accessorKey]))).join(','),
    )
    return [header, ...data].join('\r\n')
  }

  const data = rows.map((row) =>
    Object.fromEntries(columns.map(({ accessorKey, label }) => [label, row[accessorKey]])),
  )
  return format === 'json'
    ? JSON.stringify(data, normalizeJsonValue, 2)
    : data.map((row) => JSON.stringify(row, normalizeJsonValue)).join('\n')
}
