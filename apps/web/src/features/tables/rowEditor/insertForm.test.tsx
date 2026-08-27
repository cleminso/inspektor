import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { CodeEditorProps } from '@inspector/ds'
import type { ColumnDescriptor } from 'jazz-tools'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InsertRowForm } from '@tables/rowEditor/insertForm'

vi.mock('@inspector/ds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inspector/ds')>()

  return {
    ...actual,
    CodeEditor: ({
      describedBy,
      disabled = false,
      id,
      invalid = false,
      labelledBy,
      value,
    }: CodeEditorProps) => (
      <div
        id={id}
        aria-describedby={describedBy}
        aria-disabled={disabled}
        aria-invalid={invalid}
        aria-labelledby={labelledBy}
        role="textbox"
        tabIndex={disabled === true ? -1 : 0}
      >
        {value}
      </div>
    ),
  }
})

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('InsertRowForm structured values', () => {
  it('closes the insert form without submitting it', () => {
    const onClose = vi.fn()
    const onSave = vi.fn()
    const columns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onClose={onClose}
        onSave={onSave}
        rowValues={{ name: 'Ada' }}
        schemaColumns={columns}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Grace' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('ignores a second submission before saving state renders', async () => {
    let resolveSave!: () => void
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        }),
    )
    const columns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    const { container } = render(
      <InsertRowForm onSave={onSave} rowValues={{ name: 'Ada' }} schemaColumns={columns} />,
    )
    const form = container.querySelector('form')

    expect(form).not.toBeNull()
    act(() => {
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(onSave).toHaveBeenCalledOnce()

    await act(async () => {
      resolveSave()
      await Promise.resolve()
    })
  })

  it('resets the form after inserting while Insert more is enabled', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const columns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        insertMoreEnabled
        onSave={onSave}
        rowValues={{ name: 'Ada' }}
        schemaColumns={columns}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Grace' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ name: 'Grace' }, { keepOpen: true }),
    )
    await vi.waitFor(() =>
      expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Ada'),
    )
  })

  it('omits an untouched default-backed field from the insert payload', async () => {
    const onAddAnother = vi.fn()
    const columns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
      {
        name: 'status',
        column_type: { type: 'Text' },
        nullable: false,
        default: { type: 'Text', value: 'active' },
      },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{ name: 'Ada' }}
        schemaColumns={columns}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() => expect(onAddAnother).toHaveBeenCalledWith({ name: 'Ada' }))
  })

  it('allows a default-backed field to be changed to an explicit value', async () => {
    const onAddAnother = vi.fn()
    const columns = [
      {
        name: 'status',
        column_type: { type: 'Text' },
        nullable: false,
        default: { type: 'Text', value: 'active' },
      },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{}}
        schemaColumns={columns}
      />,
    )

    expect(
      screen.getByRole('checkbox', { name: 'Use default for Status' }).getAttribute('aria-checked'),
    ).toBe('true')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use default for Status' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Status' }), {
      target: { value: 'archived' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() => expect(onAddAnother).toHaveBeenCalledWith({ status: 'archived' }))
  })

  it('allows an edited field to return to schema-default omission', async () => {
    const onAddAnother = vi.fn()
    const columns = [
      {
        name: 'status',
        column_type: { type: 'Text' },
        nullable: false,
        default: { type: 'Text', value: 'active' },
      },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{}}
        schemaColumns={columns}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Use default for Status' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Status' }), {
      target: { value: 'archived' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use default for Status' }))
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() => expect(onAddAnother).toHaveBeenCalledWith({}))
  })

  it('keeps a default-backed read-only binary field omitted', () => {
    const columns = [
      {
        name: 'payload',
        column_type: { type: 'Bytea' },
        nullable: false,
        default: { type: 'Bytea', value: new Uint8Array([1, 2]) },
      },
    ] satisfies ColumnDescriptor[]
    render(<InsertRowForm onSave={() => undefined} rowValues={{}} schemaColumns={columns} />)

    expect(screen.queryByRole('checkbox', { name: 'Payload' })).toBeNull()
    expect((screen.getByRole('textbox', { name: 'Payload' }) as HTMLInputElement).value).toBe(
      '(2 bytes)',
    )
  })

  it('respects a supplied value for a nullable structured field', async () => {
    const onAddAnother = vi.fn()
    const columns = [
      { name: 'settings', column_type: { type: 'Json' }, nullable: true },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{ settings: { enabled: true } }}
        schemaColumns={columns}
      />,
    )

    expect((await screen.findByRole('textbox', { name: 'Settings' })).textContent).toContain(
      '  "enabled": true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    expect(onAddAnother).toHaveBeenCalledWith({ settings: '{"enabled":true}' })
  })

  it.each([
    ['Json', '{}'],
    ['Array', '[]'],
    ['Row', '{}'],
  ] as const)('seeds an empty %s field when switching to Value', async (type, seed) => {
    const columns = [
      {
        name: 'payload',
        column_type:
          type === 'Array'
            ? { type, element: { type: 'Text' } as const }
            : type === 'Row'
              ? { type, columns: [] }
              : { type },
        nullable: true,
      },
    ] satisfies ColumnDescriptor[]
    render(<InsertRowForm onSave={() => undefined} rowValues={{}} schemaColumns={columns} />)

    fireEvent.click(screen.getByRole('button', { name: 'Value' }))

    expect((await screen.findByRole('textbox', { name: 'Payload' })).textContent).toBe(seed)
  })

  it('disables NULL primitive and enum controls and submits values after they are enabled', async () => {
    const onAddAnother = vi.fn()
    const columns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: true },
      {
        name: 'status',
        column_type: { type: 'Enum', variants: ['active', 'archived'] },
        nullable: true,
      },
      { name: 'enabled', column_type: { type: 'Boolean' }, nullable: true },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{}}
        schemaColumns={columns}
      />,
    )

    const name = screen.getByLabelText('Name') as HTMLInputElement
    const status = screen.getByRole('combobox', { name: 'Status' }) as HTMLButtonElement
    expect(name.disabled).toBe(true)
    expect(status.disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'True' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'False' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
    expect((screen.getByRole('button', { name: 'Null' }) as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Set Name to NULL' }))
    fireEvent.change(name, { target: { value: 'Ada' } })
    fireEvent.click(screen.getByRole('button', { name: 'True' }))
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() =>
      expect(onAddAnother).toHaveBeenCalledWith({ enabled: true, name: 'Ada', status: null }),
    )
  })

  it('applies the current timestamp before inserting a nullable timestamp value', async () => {
    vi.useFakeTimers()
    const now = new Date(2026, 7, 13, 9, 10, 11, 120)
    vi.setSystemTime(now)
    const onAddAnother = vi.fn()
    const columns = [
      { name: 'publishedAt', column_type: { type: 'Timestamp' }, nullable: true },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{}}
        schemaColumns={columns}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Set PublishedAt to NULL' }))
    fireEvent.click(screen.getByRole('button', { name: 'PublishedAt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() =>
      expect(onAddAnother).toHaveBeenCalledWith({ publishedAt: now.getTime() }),
    )
    vi.useRealTimers()
  })

  it('retains insert values after a mutation error so they can be retried', async () => {
    const onAddAnother = vi
      .fn()
      .mockRejectedValueOnce(new Error('Insert failed'))
      .mockResolvedValueOnce(undefined)
    const columns = [
      { name: 'name', column_type: { type: 'Text' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    render(
      <InsertRowForm
        onSave={(values) => onAddAnother(values)}
        rowValues={{ name: 'Ada' }}
        schemaColumns={columns}
      />,
    )
    const name = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement

    fireEvent.change(name, { target: { value: 'Grace' } })
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Insert failed')
    expect(name.value).toBe('Grace')

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))

    await vi.waitFor(() => expect(onAddAnother).toHaveBeenCalledTimes(2))
    expect(onAddAnother).toHaveBeenNthCalledWith(1, { name: 'Grace' })
    expect(onAddAnother).toHaveBeenNthCalledWith(2, { name: 'Grace' })
  })
})
