import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnDescriptor } from 'jazz-tools'

import { DataGridFilterBuilder } from './dataGridFilterBuilder'
import type { TableFilterClause } from './tableFilters'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const columns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: true },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
  {
    name: 'status',
    column_type: { type: 'Enum', variants: ['active', 'paused'] },
    nullable: false,
  },
  { name: 'createdAt', column_type: { type: 'Timestamp' }, nullable: false },
  { name: 'ownerId', column_type: { type: 'Uuid' }, nullable: true, references: 'users' },
] as ColumnDescriptor[]

describe('DataGridFilterBuilder', () => {
  it('edits one compound clause atomically and preserves the clause ID', async () => {
    const onFiltersChange = vi.fn()
    const filters: TableFilterClause[] = [
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter name equals Ada' }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(valueInput, { target: { value: 'Grace' } })
    fireEvent.keyDown(valueInput, { key: 'Enter' })
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(onFiltersChange).toHaveBeenCalledWith([
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Grace' },
    ])
  })

  it('keeps a stale clause removable and repairs its column in place', async () => {
    const onFiltersChange = vi.fn()
    const filters: TableFilterClause[] = [
      { id: 'stale', column: 'removed', operator: 'eq', value: 'Ada' },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    expect(screen.getByText('Column no longer exists.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Repair filter removed equals Ada' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /Equals/u }))
    const input = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(input, { target: { value: 'Grace' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(onFiltersChange).toHaveBeenCalledWith([
      { id: 'stale', column: 'name', operator: 'eq', value: 'Grace' },
    ])
  })

  it('keeps invalid typed values in the dialog until they are corrected', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /age Integer/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(valueInput, { target: { value: '1.5' } })
    fireEvent.keyDown(valueInput, { key: 'Enter' })

    expect(screen.getByText('Integer values must be integers.')).toBeTruthy()
    expect(valueInput.getAttribute('aria-invalid')).toBe('true')
    expect(onFiltersChange).not.toHaveBeenCalled()

    fireEvent.change(valueInput, { target: { value: '2' } })
    expect(screen.queryByText('Integer values must be integers.')).toBeNull()
    fireEvent.keyDown(valueInput, { key: 'Enter' })
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'age', operator: 'eq', value: 2 }),
    ])
  })

  it('parses line-separated scalar in values into a typed array', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /age Integer/u }))
    fireEvent.click(await screen.findByRole('option', { name: /Is any of/u }))
    const input = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.paste(input, { clipboardData: { getData: () => '1\n2' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'age', operator: 'in', value: [1, 2] }),
    ])
  })

  it('cancels without applying and restores focus to the opening segment', async () => {
    const onFiltersChange = vi.fn()
    const filters: TableFilterClause[] = [
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )
    const clause = screen.getByRole('button', { name: 'Edit filter name equals Ada' })
    clause.focus()
    fireEvent.click(clause)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onFiltersChange).not.toHaveBeenCalled()
    await waitFor(() => expect(document.activeElement).toBe(clause))
  })

  it('opens from the filter root and removes clauses from their own close actions', async () => {
    const onFiltersChange = vi.fn()
    const filters: TableFilterClause[] = [
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
      { id: 'filter-2', column: 'age', operator: 'gt', value: 20 },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    const addMoreFilters = screen.getByRole('button', { name: 'Add more filters' })
    fireEvent.click(addMoreFilters)
    expect(await screen.findByRole('dialog', { name: 'Choose a column' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter name equals Ada' }))

    expect(onFiltersChange).toHaveBeenLastCalledWith([
      { id: 'filter-2', column: 'age', operator: 'gt', value: 20 },
    ])
  })

  it('ignores another removal while the controlled update is pending', async () => {
    let resolveUpdate: (() => void) | undefined
    const pendingUpdate = new Promise<void>((resolve) => {
      resolveUpdate = resolve
    })
    const onFiltersChange = vi.fn(() => pendingUpdate)
    const filters: TableFilterClause[] = [
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
      { id: 'filter-2', column: 'age', operator: 'gt', value: 20 },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter name equals Ada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter age is greater than 20' }))

    expect(onFiltersChange).toHaveBeenCalledOnce()
    await act(async () => resolveUpdate?.())
  })

  it('reports a failed controlled removal', async () => {
    const onFiltersChange = vi.fn().mockRejectedValue(new Error('Navigation failed'))
    const filters: TableFilterClause[] = [
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter name equals Ada' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Navigation failed')
    expect(screen.getByRole('button', { name: 'Edit filter name equals Ada' })).toBeTruthy()
  })

  it('keeps repeated predicates independently removable when legacy IDs collide', () => {
    const onFiltersChange = vi.fn()
    const filters: TableFilterClause[] = [
      { id: 'duplicate', column: 'name', operator: 'eq', value: 'Ada' },
      { id: 'duplicate', column: 'name', operator: 'eq', value: 'Ada' },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove filter name equals Ada' })[0])

    expect(onFiltersChange).toHaveBeenCalledWith([filters[1]])
  })

  it('focuses the last applied clause before removing clauses from the end', async () => {
    function ControlledExample() {
      const [filters, setFilters] = React.useState<TableFilterClause[]>([
        { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
        { id: 'filter-2', column: 'age', operator: 'gt', value: 20 },
      ])
      return (
        <DataGridFilterBuilder columns={columns} filters={filters} onFiltersChange={setFilters} />
      )
    }
    const React = await import('react')
    render(<ControlledExample />)

    const root = screen.getByRole('button', { name: 'Add more filters' })
    root.focus()
    fireEvent.keyDown(root, { key: 'Backspace' })

    const ageClause = screen.getByRole('group', { name: 'Filter age is greater than 20' })
    expect(document.activeElement).toBe(ageClause)
    fireEvent.keyDown(ageClause, { key: 'Backspace' })

    expect(screen.queryByRole('button', { name: 'Edit filter age is greater than 20' })).toBeNull()
    const nameClause = screen.getByRole('group', { name: 'Filter name equals Ada' })
    await waitFor(() => expect(document.activeElement).toBe(nameClause))

    fireEvent.keyDown(nameClause, { key: 'Backspace' })

    expect(screen.queryByRole('button', { name: 'Edit filter name equals Ada' })).toBeNull()
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Filter table' })),
    )
  })

  it('restores clause focus after an asynchronous removal is rendered', async () => {
    vi.useFakeTimers()

    function ControlledExample() {
      const [filters, setFilters] = React.useState<TableFilterClause[]>([
        { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
        { id: 'filter-2', column: 'age', operator: 'gt', value: 20 },
      ])
      return (
        <DataGridFilterBuilder
          columns={columns}
          filters={filters}
          onFiltersChange={(nextFilters) => {
            setTimeout(() => setFilters(nextFilters), 10)
          }}
        />
      )
    }
    const React = await import('react')
    render(<ControlledExample />)

    const appliedFilters = screen.getByRole('group', { name: 'Applied table filters' })
    fireEvent.click(appliedFilters)
    fireEvent.keyDown(appliedFilters, { key: 'Backspace' })
    fireEvent.keyDown(screen.getByRole('group', { name: 'Filter age is greater than 20' }), {
      key: 'Backspace',
    })

    await act(async () => vi.advanceTimersByTimeAsync(10))

    expect(document.activeElement).toBe(
      screen.getByRole('group', { name: 'Filter name equals Ada' }),
    )
  })

  it('returns focus to the applied-filter area when Escape cancels clause deletion', () => {
    const onFiltersChange = vi.fn()
    const filters: TableFilterClause[] = [
      { id: 'filter-1', column: 'name', operator: 'eq', value: 'Ada' },
      { id: 'filter-2', column: 'age', operator: 'gt', value: 20 },
    ]
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    )

    const appliedFilters = screen.getByRole('group', { name: 'Applied table filters' })
    fireEvent.click(appliedFilters)
    fireEvent.keyDown(appliedFilters, { key: 'Backspace' })
    const selectedClause = screen.getByRole('group', { name: 'Filter age is greater than 20' })

    expect(document.activeElement).toBe(selectedClause)
    fireEvent.keyDown(selectedClause, { key: 'Escape' })

    expect(document.activeElement).toBe(appliedFilters)
    expect(onFiltersChange).not.toHaveBeenCalled()
  })

  it('lists distinct loaded values while keeping free-form value entry available', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={[]}
        rows={[
          { id: '1', name: 'Ada' },
          { id: '2', name: 'Grace' },
          { id: '3', name: 'Ada' },
        ]}
        onFiltersChange={onFiltersChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))

    expect(screen.queryByText('Values')).toBeNull()
    expect(await screen.findByRole('option', { name: 'Ada' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Grace' })).toBeTruthy()
    expect(screen.getAllByRole('option', { name: 'Ada' })).toHaveLength(1)
    expect(screen.getByRole('combobox', { name: 'Filter value' })).toBeTruthy()
    fireEvent.click(screen.getByRole('option', { name: 'Grace' }))

    expect(onFiltersChange).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('button', { name: 'Edit draft filter name equals Grace' }),
    ).toBeTruthy()

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Filter columns' }), { key: 'Enter' })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'name', operator: 'eq', value: 'Grace' }),
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps completed clauses staged until Enter applies the command', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(valueInput, { target: { value: 'Ada' } })
    fireEvent.keyDown(valueInput, { key: 'Enter' })

    expect(onFiltersChange).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('button', { name: 'Edit draft filter name equals Ada' }),
    ).toBeTruthy()
    const columnInput = screen.getByRole('combobox', { name: 'Filter columns' })
    expect(document.activeElement).toBe(columnInput)
    fireEvent.keyDown(columnInput, { key: 'Enter' })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'name', operator: 'eq', value: 'Ada' }),
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps the command open after removing its only staged clause', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(valueInput, { target: { value: 'Ada' } })
    fireEvent.keyDown(valueInput, { key: 'Enter' })

    const columnInput = await screen.findByRole('combobox', { name: 'Filter columns' })
    const removeDraft = await screen.findByRole('button', {
      name: 'Remove draft filter name equals Ada',
    })
    removeDraft.focus()
    fireEvent.pointerDown(removeDraft, { button: 0, pointerType: 'mouse' })
    fireEvent.mouseDown(removeDraft, { button: 0 })
    fireEvent.click(removeDraft)

    expect(screen.getByRole('dialog', { name: 'Choose a column' })).toBeTruthy()
    expect(document.activeElement).toBe(columnInput)
    expect(onFiltersChange).not.toHaveBeenCalled()
  })

  it('removes the last staged clause on Backspace and closes on the following Backspace', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(valueInput, { target: { value: 'Ada' } })
    fireEvent.keyDown(valueInput, { key: 'Enter' })

    const columnInput = await screen.findByRole('combobox', { name: 'Filter columns' })
    fireEvent.keyDown(columnInput, { key: 'Backspace' })

    expect(screen.getByRole('dialog', { name: 'Choose a column' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remove draft filter name equals Ada' })).toBeNull()
    expect(document.activeElement).toBe(columnInput)

    fireEvent.keyDown(columnInput, { key: 'Backspace' })

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(onFiltersChange).not.toHaveBeenCalled()
  })

  it('selects another column after explicit navigation and discards staged clauses on Escape', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(valueInput, { target: { value: 'Ada' } })
    fireEvent.keyDown(valueInput, { key: 'Enter' })

    const columnInput = await screen.findByRole('combobox', { name: 'Filter columns' })
    fireEvent.keyDown(columnInput, { key: 'ArrowDown' })
    fireEvent.keyDown(columnInput, { key: 'Enter' })

    expect(await screen.findByRole('combobox', { name: 'Filter operators' })).toBeTruthy()
    expect(onFiltersChange).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onFiltersChange).not.toHaveBeenCalled()
  })

  it('stages multiple clauses and applies them together with a final Enter', async () => {
    const changes: TableFilterClause[][] = []
    function ControlledExample() {
      const [filters, setFilters] = React.useState<TableFilterClause[]>([])
      return (
        <DataGridFilterBuilder
          columns={columns}
          filters={filters}
          onFiltersChange={(nextFilters) => {
            changes.push(nextFilters)
            setFilters(nextFilters)
          }}
        />
      )
    }
    const React = await import('react')
    render(<ControlledExample />)

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const firstValueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(firstValueInput, { target: { value: 'Ada' } })
    fireEvent.keyDown(firstValueInput, { key: 'Enter' })

    expect(await screen.findByRole('dialog', { name: 'Choose a column' })).toBeTruthy()
    fireEvent.click(screen.getByRole('option', { name: /age Integer/u }))
    await screen.findByRole('combobox', { name: 'Filter operators' })
    fireEvent.click(screen.getByRole('option', { name: 'Is greater than' }))
    const secondValueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.change(secondValueInput, { target: { value: '20' } })
    fireEvent.keyDown(secondValueInput, { key: 'Enter' })
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(changes.at(-1)).toEqual([
      expect.objectContaining({ column: 'name', operator: 'eq', value: 'Ada' }),
      expect.objectContaining({ column: 'age', operator: 'gt', value: 20 }),
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('navigates to an inline date step and stages a normalized timestamp', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 19, 13, 16))
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /createdAt Timestamp/u }))
    fireEvent.click(await screen.findByRole('option', { name: 'Is greater than' }))

    expect(await screen.findByRole('option', { name: 'Today' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Yesterday' })).toBeTruthy()
    expect(screen.getByRole('option', { name: '7 days ago' })).toBeTruthy()
    expect(screen.getByRole('option', { name: '30 days ago' })).toBeTruthy()
    fireEvent.click(screen.getByRole('option', { name: 'Pick a date…' }))

    expect(await screen.findByRole('group', { name: 'Choose date and time' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Choose date and time' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Filter value' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onFiltersChange).not.toHaveBeenCalled()
    const pendingClause = await screen.findByRole('button', {
      name: 'Edit draft filter createdAt is greater than 2026-08-19',
    })
    expect(pendingClause.textContent).toContain('2026-08-19')
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Filter columns' }), { key: 'Enter' })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'createdAt', operator: 'gt', value: expect.any(Number) }),
    ])
  })

  it('formats applied timestamp values as year-month-day', () => {
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={[
          {
            id: 'created',
            column: 'createdAt',
            operator: 'eq',
            value: new Date(2026, 7, 19).getTime(),
          },
        ]}
        onFiltersChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Edit filter createdAt equals 2026-08-19' }).textContent,
    ).toContain('2026-08-19')
  })

  it('stages the highlighted suggested value and applies it with a final Enter', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /status Enum/u }))
    fireEvent.click(await screen.findByRole('option', { name: /^Equals/u }))
    const valueInput = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.keyDown(valueInput, { key: 'ArrowDown' })
    fireEvent.keyDown(valueInput, { key: 'Enter' })
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'status', operator: 'eq', value: 'active' }),
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('focuses the draft chip before Backspace clears it', async () => {
    render(<DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    fireEvent.click(await screen.findByRole('option', { name: /Equals/u }))
    const input = await screen.findByRole('combobox', { name: 'Filter value' })
    fireEvent.keyDown(input, { key: 'Backspace' })

    const chip = screen.getByRole('button', { name: 'Edit filter name equals' })
    expect(document.activeElement).toBe(chip)
    expect(screen.getByRole('combobox', { name: 'Filter value' })).toBeTruthy()

    fireEvent.keyDown(chip, { key: 'Backspace' })

    expect(await screen.findByRole('combobox', { name: 'Filter columns' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Edit filter name equals' })).toBeNull()
  })

  it('supports explicit keyboard navigation across stage changes', async () => {
    render(<DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    const columnInput = await screen.findByRole('combobox', { name: 'Filter columns' })
    fireEvent.keyDown(columnInput, { key: 'ArrowDown' })
    fireEvent.keyDown(columnInput, { key: 'Enter' })

    const operatorInput = await screen.findByRole('combobox', { name: 'Filter operators' })
    fireEvent.keyDown(operatorInput, { key: 'ArrowDown' })
    fireEvent.keyDown(operatorInput, { key: 'Enter' })

    expect(await screen.findByRole('combobox', { name: 'Filter value' })).toBeTruthy()
  })

  it('accepts standard operator glyphs and aliases from the palette input', async () => {
    render(<DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /name Text/u }))
    const operatorInput = await screen.findByRole('combobox', { name: 'Filter operators' })
    fireEvent.change(operatorInput, { target: { value: '!=' } })
    fireEvent.keyDown(operatorInput, { key: 'ArrowDown' })
    fireEvent.keyDown(operatorInput, { key: 'Enter' })

    await screen.findByRole('combobox', { name: 'Filter value' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Edit filter name does not equal' })).toBeTruthy()
  })

  it('presents null checks as unary clauses', async () => {
    const onFiltersChange = vi.fn()
    render(
      <DataGridFilterBuilder columns={columns} filters={[]} onFiltersChange={onFiltersChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }))
    fireEvent.click(await screen.findByRole('option', { name: /ownerId UUID/u }))
    fireEvent.click(await screen.findByRole('option', { name: 'Is not null' }))
    fireEvent.keyDown(await screen.findByRole('combobox', { name: 'Filter columns' }), {
      key: 'Enter',
    })

    expect(onFiltersChange).toHaveBeenCalledWith([
      expect.objectContaining({ column: 'ownerId', operator: 'isNull', value: false }),
    ])
  })

  it('edits an applied null check from the operator stage', async () => {
    render(
      <DataGridFilterBuilder
        columns={columns}
        filters={[{ id: 'owner', column: 'ownerId', operator: 'isNull', value: false }]}
        onFiltersChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter ownerId is not null' }))

    expect(await screen.findByRole('combobox', { name: 'Filter operators' })).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: 'Filter value' })).toBeNull()
  })
})
