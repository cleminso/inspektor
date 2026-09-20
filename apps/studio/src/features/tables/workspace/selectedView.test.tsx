import { useState } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SelectedTableView } from '@tables/workspace/selectedView'

let mountCount = 0
const searchState = { view: 'data' as 'data' | 'schema' }

vi.mock('@tables/routing/useTableSearchParams', () => ({
  useTableExplorerSearchParams: () => searchState,
}))

vi.mock('@tables/workspace/tableView', () => ({
  TableView: ({ tableName }: { tableName: string }) => {
    const [mountId] = useState(() => ++mountCount)
    return <div>{`${tableName}:${mountId}`}</div>
  },
}))

vi.mock('@tables/schema/view', () => ({
  SchemaView: ({ tableName }: { tableName: string }) => <div>{`Schema: ${tableName}`}</div>,
}))

afterEach(() => {
  cleanup()
  mountCount = 0
  searchState.view = 'data'
})

describe('SelectedTableView', () => {
  it('remounts table-scoped data state when the table changes', () => {
    const { rerender } = render(<SelectedTableView tableName="accounts" />)
    expect(screen.getByText('accounts:1')).not.toBeNull()

    rerender(<SelectedTableView tableName="users" />)

    expect(screen.getByText('users:2')).not.toBeNull()
  })
})
