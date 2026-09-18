import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RelationCellLink } from '@tables/grid/relationCellLink'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    search,
    to,
  }: {
    children?: React.ReactNode
    params: { connectionId: string; tableName: string }
    search: Record<string, unknown>
    to: string
  }) => (
    <a
      data-search={JSON.stringify(search)}
      href={to
        .replace('$connectionId', params.connectionId)
        .replace('$tableName', params.tableName)}
    >
      {children}
    </a>
  ),
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
}))

afterEach(cleanup)

describe('RelationCellLink', () => {
  it('links the stored ID to its related table', () => {
    render(<RelationCellLink relationTable="accounts" relationId="account_0123456789" />)

    const link = screen.getByRole('link', { name: 'account_0123456789' })
    expect(link.getAttribute('href')).toBe('/conn/connection-1/tables/accounts')
    expect(link.getAttribute('data-search')).toBe('{}')
  })
})
