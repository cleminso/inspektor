import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SchemaSwitcher } from '@app/shell/header/schemaSwitcher'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentSchemaHash: 'schema-1',
    switchSchema: vi.fn(),
  }),
  useRuntimeSchemaHashes: () => ['schema-1'],
}))

afterEach(cleanup)

describe('SchemaSwitcher', () => {
  it('excludes the displayed schema hash from translation', () => {
    render(<SchemaSwitcher />)
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Switch schema' }), {
      key: 'ArrowDown',
    })

    for (const schemaHash of screen.getAllByText('schema-1')) {
      expect(schemaHash.closest('[translate="no"]')).toBeTruthy()
    }
  })
})
