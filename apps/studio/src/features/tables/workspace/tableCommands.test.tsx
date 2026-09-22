import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { TableCommands } from '@tables/workspace/tableCommands'

const navigate = vi.hoisted(() => vi.fn())
const prepareNavigation = vi.hoisted(() =>
  vi.fn(async (_options: unknown, commit: () => Promise<void> | void) => {
    await commit()
    return 'committed'
  }),
)
const availableTables = vi.hoisted(() => ({
  isSchemaReady: true,
  tables: ['accounts', 'profiles'],
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
}))

vi.mock('@tables/schema/useAvailableTables', () => ({
  useAvailableTables: () => availableTables,
}))

vi.mock('@tables/routing/tableNavigationPreparation', () => ({
  useTableNavigationPreparation: () => ({ prepare: prepareNavigation }),
}))

beforeEach(() => {
  availableTables.isSchemaReady = true
  availableTables.tables = ['accounts', 'profiles']
  prepareNavigation.mockClear()
})

afterEach(() => {
  cleanup()
  navigate.mockReset()
})

describe('TableCommands', () => {
  it('delegates table-route preparation when the workspace owns navigation', async () => {
    const onOpenTable = vi.fn()
    render(
      <AppHotkeysProvider>
        <TableCommands onOpenTable={onOpenTable} tabs={[]} />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const input = await screen.findByRole('combobox', { name: 'Search commands' })
    fireEvent.change(input, { target: { value: 'profiles' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onOpenTable).toHaveBeenCalledWith('profiles', {})
    expect(navigate).not.toHaveBeenCalled()
  })

  it('registers tables without active workspace tabs', async () => {
    render(
      <AppHotkeysProvider>
        <TableCommands />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(await screen.findByText('Tables')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'profiles' })).toBeTruthy()
  })

  it('filters table names and restores an existing data tab search', async () => {
    render(
      <AppHotkeysProvider>
        <TableCommands
          tabs={[
            {
              kind: 'table',
              id: 'table:accounts',
              tableName: 'accounts',
              search: { filters: 'active', page: 2, pageSize: 500 },
            },
          ]}
        />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const input = await screen.findByRole('combobox', { name: 'Search commands' })
    expect(screen.getByText('Tables')).toBeTruthy()

    fireEvent.change(input, { target: { value: 'accounts' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/conn/$connectionId/tables/$tableName',
        params: { connectionId: 'connection-1', tableName: 'accounts' },
        search: { filters: 'active', page: 2, pageSize: 500 },
      }),
    )
    expect(prepareNavigation).toHaveBeenCalledWith(
      {
        policy: 'replace',
        search: {
          filters: [],
          page: 2,
          pageSize: 500,
          sortColumn: 'id',
          sortDirection: 'asc',
        },
        tableName: 'accounts',
      },
      expect.any(Function),
    )
  })

  it('opens a missing table with the base search', async () => {
    render(
      <AppHotkeysProvider>
        <TableCommands tabs={[]} />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const input = await screen.findByRole('combobox', { name: 'Search commands' })
    fireEvent.change(input, { target: { value: 'profiles' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/conn/$connectionId/tables/$tableName',
        params: { connectionId: 'connection-1', tableName: 'profiles' },
        search: {},
      }),
    )
  })

  it('hides table commands until the schema is ready', async () => {
    availableTables.isSchemaReady = false

    render(
      <AppHotkeysProvider>
        <TableCommands tabs={[]} />
      </AppHotkeysProvider>,
    )

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(await screen.findByText('No commands available.')).toBeTruthy()
    expect(screen.queryByText('Tables')).toBeNull()
  })
})
