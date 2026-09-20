import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SchemaView } from '@tables/schema/view'

const permissions = {
  permissions: {
    profiles: { anyone: ['read'] },
    rooms: { anyone: ['read', 'write'] },
  },
}

const runtime: {
  isPermissionsLoading: boolean
  permissions: typeof permissions | null
  schema: Record<string, unknown>
} = {
  isPermissionsLoading: false,
  permissions,
  schema: {
    profiles: {
      columns: [],
      metadata: { nested: { levelThree: { levelFour: { value: 'profile' } } } },
    },
    rooms: {
      columns: [],
      metadata: { nested: { value: 'room' } },
    },
  },
}

vi.mock('@app/providers/inspectorProvider', () => ({
  useRuntimePermissions: () => runtime.permissions,
  useRuntimePermissionsLoading: () => runtime.isPermissionsLoading,
  useRuntimeSchema: () => runtime.schema,
}))

afterEach(cleanup)
beforeEach(() => {
  runtime.isPermissionsLoading = false
  runtime.permissions = permissions
})

describe('SchemaView', () => {
  it('replaces permissions loading state with the loaded document', () => {
    runtime.isPermissionsLoading = true
    runtime.permissions = null
    const { rerender } = render(<SchemaView tableName="profiles" />)

    const loadingPermissions = screen.getByRole('region', { name: 'Permissions' })
    expect(within(loadingPermissions).getByText('Loading permissions…')).toBeTruthy()
    expect(within(loadingPermissions).queryByRole('tree')).toBeNull()

    runtime.isPermissionsLoading = false
    runtime.permissions = permissions
    rerender(<SchemaView tableName="profiles" />)

    const loadedPermissions = screen.getByRole('region', { name: 'Permissions' })
    expect(within(loadedPermissions).queryByText('Loading permissions…')).toBeNull()
    expect(within(loadedPermissions).getByRole('tree', { name: 'Permissions JSON' })).toBeTruthy()
    expect(within(loadedPermissions).getByRole('treeitem', { name: /anyone/i })).toBeTruthy()
  })

  it('expands nested content and resets panel state for another table', () => {
    const { rerender } = render(<SchemaView tableName="profiles" />)
    const schema = screen.getByRole('region', { name: 'Schema' })
    fireEvent.click(within(schema).getByRole('button', { name: 'Expand' }))
    expect(within(schema).getByRole('button', { name: 'Collapse' })).toBeTruthy()
    expect(within(schema).getByRole('treeitem', { name: /levelFour/i })).toBeTruthy()
    fireEvent.click(within(schema).getByRole('button', { name: 'Find schema JSON' }))

    rerender(<SchemaView tableName="rooms" />)

    const nextSchema = screen.getByRole('region', { name: 'Schema' })
    expect(within(nextSchema).queryByRole('searchbox')).toBeNull()
    expect(within(nextSchema).getByRole('button', { name: 'Expand' })).toBeTruthy()
  })
})
