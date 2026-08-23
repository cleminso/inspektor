import { useState } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SelectedTableView } from '@tables/workspace/selectedView'

let mountCount = 0
const inspectorState = {
  currentBranch: 'main',
  currentConnectionId: 'connection-1',
  currentSchemaHash: 'schema-1',
  runtime: {
    wasmSchema: null as Record<string, unknown> | null,
  },
}

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => inspectorState,
  useRuntimeSchema: () => inspectorState.runtime.wasmSchema,
}))

vi.mock('@tables/routing/useTableSearchParams', () => ({
  useTableExplorerSearchParams: () => ({ view: 'data' }),
}))

vi.mock('@tables/workspace/tableView', () => ({
  TableView: ({ tableName }: { tableName: string }) => {
    const [mountId] = useState(() => ++mountCount)
    return <div>{`${tableName}:${mountId}`}</div>
  },
}))

vi.mock('@tables/schema/view', () => ({
  SchemaView: () => null,
}))

afterEach(() => {
  cleanup()
  mountCount = 0
  inspectorState.runtime.wasmSchema = null
})

describe('SelectedTableView', () => {
  it('keeps the table workspace mounted without schema metadata', () => {
    render(<SelectedTableView tableName="accounts" />)

    expect(screen.getByText('accounts:1')).not.toBeNull()
    expect(screen.queryByText('Loading table')).toBeNull()
  })

  it('remounts table-scoped data state when the table changes', () => {
    inspectorState.runtime.wasmSchema = {}
    const { rerender } = render(<SelectedTableView tableName="accounts" />)
    expect(screen.getByText('accounts:1')).not.toBeNull()

    rerender(<SelectedTableView tableName="users" />)

    expect(screen.getByText('users:2')).not.toBeNull()
  })
})
