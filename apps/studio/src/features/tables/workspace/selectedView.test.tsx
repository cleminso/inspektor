import { useState } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SelectedTableView } from '@tables/workspace/selectedView'

let mountCount = 0

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
})

describe('SelectedTableView', () => {
  it('remounts table-scoped data state when the table changes', () => {
    const { rerender } = render(<SelectedTableView tableName="accounts" view="data" />)
    expect(screen.getByText('accounts:1')).not.toBeNull()

    rerender(<SelectedTableView tableName="users" view="data" />)

    expect(screen.getByText('users:2')).not.toBeNull()
  })

  it('renders the route-owned schema view without subscribing to full table search state', () => {
    render(<SelectedTableView tableName="accounts" view="schema" />)

    expect(screen.getByText('Schema: accounts')).not.toBeNull()
  })
})
