import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SchemaSwitcher } from '@app/shell/header/schemaSwitcher'

const schemaState = vi.hoisted(() => ({
  currentSchemaHash: 'schema-1',
  schemaHashes: ['schema-1'],
}))

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentSchemaHash: schemaState.currentSchemaHash,
    switchSchema: vi.fn(),
  }),
  useRuntimeSchemaHashes: () => schemaState.schemaHashes,
}))

function openSchemaSwitcher(): void {
  fireEvent.keyDown(screen.getByRole('combobox', { name: /Switch schema/ }), {
    key: 'ArrowDown',
  })
}

afterEach(() => {
  cleanup()
  schemaState.currentSchemaHash = 'schema-1'
  schemaState.schemaHashes = ['schema-1']
})

describe('SchemaSwitcher', () => {
  it('excludes the displayed schema hash from translation', () => {
    render(<SchemaSwitcher />)
    openSchemaSwitcher()

    for (const schemaHash of screen.getAllByText('schema-1')) {
      expect(schemaHash.closest('[translate="no"]')).toBeTruthy()
    }
  })

  it('shows the latest schema first with a short hash and status tooltip', () => {
    const newestHash = '2'.repeat(64)
    const olderHash = '1'.repeat(64)
    schemaState.currentSchemaHash = newestHash
    schemaState.schemaHashes = [newestHash, olderHash]

    render(<SchemaSwitcher />)
    openSchemaSwitcher()

    const options = screen.getAllByRole('option')
    expect(options[0]?.textContent).toContain('222222222222')
    expect(options[0]?.textContent).not.toContain('Latest')
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[0]?.getAttribute('aria-label')).toBe(`${newestHash}, Latest`)
    expect(options[0]?.hasAttribute('data-base-ui-tooltip-trigger')).toBe(true)
    expect(
      screen
        .getByRole('combobox', { name: /Switch schema/ })
        .hasAttribute('data-base-ui-tooltip-trigger'),
    ).toBe(false)
    expect(options[1]?.textContent).toContain('111111111111')
    expect(screen.queryByText(newestHash)).toBeNull()
  })

  it('identifies an older selected schema separately from the latest schema', () => {
    schemaState.currentSchemaHash = 'schema-1'
    schemaState.schemaHashes = ['schema-2', 'schema-1']

    render(<SchemaSwitcher />)

    expect(screen.getByText('Older')).toBeTruthy()
    openSchemaSwitcher()
    const latestOption = screen.getByRole('option', { name: /schema-2/i })
    const selectedOption = screen.getByRole('option', { name: /schema-1/i })
    expect(latestOption.textContent).not.toContain('Latest')
    expect(latestOption.getAttribute('aria-label')).toBe('schema-2, Latest')
    expect(latestOption.hasAttribute('data-base-ui-tooltip-trigger')).toBe(true)
    expect(selectedOption.getAttribute('aria-selected')).toBe('true')
    expect(selectedOption.getAttribute('aria-label')).toBe('schema-1, Older')
    expect(selectedOption.hasAttribute('data-base-ui-tooltip-trigger')).toBe(true)
  })

  it('shows search above ten schemas and filters by the complete Jazz hash', () => {
    const schemaHashes = Array.from({ length: 11 }, (_, index) => index.toString(16).repeat(64))
    const targetHash = schemaHashes[10]!
    schemaState.currentSchemaHash = schemaHashes[0]!
    schemaState.schemaHashes = schemaHashes

    render(<SchemaSwitcher />)
    openSchemaSwitcher()

    const search = screen.getByRole('combobox', { name: 'Search schemas' })
    fireEvent.input(search, {
      target: { value: targetHash },
      inputType: 'insertText',
    })

    expect(
      document
        .querySelector('[data-slot="context-switcher-viewport"]')
        ?.getAttribute('data-max-height'),
    ).toBe('l')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option').getAttribute('aria-label')).toBe(`${targetHash}, Older`)
  })

  it('omits search when all ten schemas are visible', () => {
    const schemaHashes = Array.from({ length: 10 }, (_, index) => index.toString(16).repeat(64))
    schemaState.currentSchemaHash = schemaHashes[0]!
    schemaState.schemaHashes = schemaHashes

    render(<SchemaSwitcher />)
    openSchemaSwitcher()

    expect(screen.queryByRole('combobox', { name: 'Search schemas' })).toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(10)
  })
})
