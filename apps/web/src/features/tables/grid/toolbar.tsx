import { useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

import { Box, Button, Menu, Select, Text, Tooltip, type DataGridTable } from '@inspektor/ds'

import { createDataExport, type DataExportFormat } from '@tables/grid/dataExport'
import { TABLE_PAGE_SIZE_OPTIONS } from '@tables/tableTypes'
import type { TableColumnMeta, TablePageSize, DynamicTableRow } from '@tables/tableTypes'

const pageSizeItems = TABLE_PAGE_SIZE_OPTIONS.map((value) => ({
  label: String(value),
  value,
}))

const rowCountFormatter = new Intl.NumberFormat(undefined)

const exportContentTypes = {
  csv: 'text/csv;charset=utf-8',
  json: 'application/json;charset=utf-8',
  ndjson: 'application/x-ndjson;charset=utf-8',
} satisfies Record<DataExportFormat, string>

interface TablePaginationProps {
  hasNextPage: boolean
  hasPreviousPage: boolean
  loadedRowCount: number
  loading?: boolean
  page: number
  pageSize: TablePageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: TablePageSize) => void
}

interface PaginationSummary {
  hasNextPage: boolean
  loadedRowCount: number
  page: number
  pageSize: TablePageSize
}

function formatRowStatus(summary: PaginationSummary): string {
  const firstRow = summary.loadedRowCount === 0 ? 0 : (summary.page - 1) * summary.pageSize + 1
  const lastRow = (summary.page - 1) * summary.pageSize + summary.loadedRowCount
  const total =
    summary.hasNextPage === true
      ? `${rowCountFormatter.format(lastRow + 1)}+`
      : rowCountFormatter.format(lastRow)
  return `${rowCountFormatter.format(firstRow)}–${rowCountFormatter.format(lastRow)} of ${total}`
}

export function TablePagination({
  hasNextPage,
  hasPreviousPage,
  loadedRowCount,
  loading = false,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps): React.ReactElement {
  const currentSummary = { hasNextPage, loadedRowCount, page, pageSize }
  const settledSummaryRef = useRef<PaginationSummary | null>(
    loading === true ? null : currentSummary,
  )
  useLayoutEffect(() => {
    if (loading === false) {
      settledSummaryRef.current = { hasNextPage, loadedRowCount, page, pageSize }
    }
  }, [hasNextPage, loadedRowCount, loading, page, pageSize])
  const summary = loading === true ? settledSummaryRef.current : currentSummary
  const rowStatus = summary === null ? null : formatRowStatus(summary)

  return (
    <Box
      alignItems="center"
      gap="xs"
    >
      <Text
        color="muted"
        variant="caption"
      >
        {rowStatus}
      </Text>
      <Select.Root
        items={pageSizeItems}
        value={pageSize}
        onValueChange={(value) => {
          if (value !== null) {
            onPageSizeChange(value)
          }
        }}
      >
        <Select.Trigger
          aria-label="Rows per page"
          size="s"
          width="content"
        />
        <Select.Content>
          {pageSizeItems.map((item) => (
            <Select.Item
              key={item.value}
              value={item.value}
            >
              {item.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Button
              aria-label="Previous page"
              disabled={loading === true || hasPreviousPage === false}
              iconOnly
              size="xs"
              variant="ghost"
              onClick={() => onPageChange(page - 1)}
            >
              <Button.Glyph artwork={ChevronLeft} />
            </Button>
          }
        />
        <Tooltip.Content>Previous page</Tooltip.Content>
      </Tooltip.Root>
      <Text
        color="muted"
        data-numeric-variant="tabular"
        tabularNums
        variant="caption"
      >
        Page {summary?.page ?? page}
      </Text>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <Button
              aria-label="Next page"
              disabled={loading === true || hasNextPage === false}
              iconOnly
              size="xs"
              variant="ghost"
              onClick={() => onPageChange(page + 1)}
            >
              <Button.Glyph artwork={ChevronRight} />
            </Button>
          }
        />
        <Tooltip.Content>Next page</Tooltip.Content>
      </Tooltip.Root>
    </Box>
  )
}

interface DataGridExportProps {
  table: DataGridTable<DynamicTableRow>
  tableColumns: readonly TableColumnMeta[]
  tableName: string
}

function downloadExport(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.download = filename
  anchor.href = url
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function DataGridExport({
  table,
  tableColumns,
  tableName,
}: DataGridExportProps): React.ReactElement {
  const hasRows = table.getRowModel().rows.length > 0

  const handleExport = (format: DataExportFormat) => {
    const exportRows = table.getRowModel().rows.map((row) => row.original)
    const columnsById = new Map(tableColumns.map((column) => [column.id, column]))
    const exportColumns = table.getVisibleLeafColumns().flatMap((column) => {
      const tableColumn = columnsById.get(column.id)
      return tableColumn === undefined
        ? []
        : [{ accessorKey: tableColumn.accessorKey, label: tableColumn.label }]
    })
    downloadExport(
      createDataExport(format, exportColumns, exportRows),
      `${tableName}.${format}`,
      exportContentTypes[format],
    )
  }

  return (
    <Tooltip.Root>
      <Menu.Root disabled={hasRows === false}>
        <Tooltip.Trigger
          render={
            <Menu.Trigger
              render={
                <Button
                  aria-label="Export rows"
                  iconOnly
                  variant="ghost"
                  size="s"
                  disabled={hasRows === false}
                >
                  <Button.Glyph artwork={Download} />
                </Button>
              }
            />
          }
        />
        <Menu.Content align="end">
          <Menu.Item onClick={() => handleExport('csv')}>CSV</Menu.Item>
          <Menu.Item onClick={() => handleExport('json')}>JSON</Menu.Item>
          <Menu.Item onClick={() => handleExport('ndjson')}>NDJSON</Menu.Item>
        </Menu.Content>
      </Menu.Root>
      <Tooltip.Content>Export rows</Tooltip.Content>
    </Tooltip.Root>
  )
}

interface ToolbarProps {
  actions: React.ReactNode
  children?: React.ReactNode
  pagination?: React.ReactNode
}

export function Toolbar({ actions, children, pagination }: ToolbarProps): React.ReactElement {
  return (
    <Box
      width="full"
      flexShrink={0}
      alignItems="center"
      gap="s"
      paddingVertical="s"
      paddingHorizontal="xs"
      backgroundColor="surface-background"
    >
      <Box
        minWidth={0}
        flex={1}
      >
        {children}
      </Box>
      <Box
        flexShrink={0}
        alignItems="center"
        gap="s"
      >
        {pagination}
      </Box>
      {actions}
    </Box>
  )
}
