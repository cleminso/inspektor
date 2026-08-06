import type { TablePageSize } from '@tables/tableTypes'

interface TableViewportScrollResetState {
  isInitialLoading: boolean
  page: number
  pageSize: TablePageSize
}

export function getTableViewportScrollResetKey({
  isInitialLoading,
  page,
  pageSize,
}: TableViewportScrollResetState): string {
  return `${page}:${pageSize}:${isInitialLoading === true ? 'loading' : 'ready'}`
}
