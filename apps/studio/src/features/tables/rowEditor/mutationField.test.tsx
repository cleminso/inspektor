import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { useState, type ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MutationField } from '@tables/rowEditor/mutationField'
import type { MutationFieldInput } from '@tables/rowEditor/mutation/draft'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    'aria-label': ariaLabel,
    'data-slot': dataSlot,
  }: React.ComponentProps<'a'> & { 'data-slot'?: string }) => (
    <a
      aria-label={ariaLabel}
      data-slot={dataSlot}
      href="/relation"
    >
      {children}
    </a>
  ),
}))

afterEach(cleanup)

function column(
  name: string,
  columnType: ColumnDescriptor['column_type'],
  options: Partial<ColumnDescriptor> = {},
): ColumnDescriptor {
  return { column_type: columnType, name, nullable: false, ...options } as ColumnDescriptor
}

type MutationFieldProps = ComponentProps<typeof MutationField>

function renderMutationField(
  props: Pick<MutationFieldProps, 'column' | 'input'> & Partial<MutationFieldProps>,
) {
  return render(
    <MutationField
      canOmit={false}
      error={undefined}
      expanded={false}
      hidden={false}
      initialValue={undefined}
      onExpandedChange={() => undefined}
      onInputChange={() => undefined}
      readOnlyReason={null}
      {...props}
    />,
  )
}

describe('MutationField', () => {
  it('places the column type at the trailing edge of the field header', () => {
    renderMutationField({
      column: column('roomId', { type: 'Uuid' }, { references: 'rooms' }),
      input: { mode: 'value', text: 'room-1' },
      initialValue: 'room-1',
    })

    const type = screen.getByText('UUID')
    const header = type.closest('[data-slot="mutation-field-header"]')

    expect(header?.lastElementChild).toBe(type)
    expect(header === null ? null : getComputedStyle(header).width).toBe('100%')
  })

  it('keeps relation navigation inside the value input group', () => {
    renderMutationField({
      column: column('roomId', { type: 'Uuid' }, { references: 'rooms' }),
      input: { mode: 'value', text: 'room-1' },
      initialValue: 'room-1',
    })

    const input = screen.getByRole('textbox', { name: 'RoomId' })
    const targetLink = screen.getByRole('link', { name: 'Open referenced table' })
    expect(input.closest('[data-slot="input-group"]')?.contains(targetLink)).toBe(true)
    expect(targetLink.getAttribute('data-slot')).toBe('input-group-link')
    expect(input.getAttribute('data-font')).toBe('mono')
    expect(screen.queryByRole('link', { name: 'Show' })).toBeNull()
  })

  it('shows the concrete schema default with its control inside the input group', () => {
    const onOmittedChange = vi.fn()

    renderMutationField({
      canOmit: true,
      column: column('origin', { type: 'Text' }, { default: { type: 'Text', value: 'web' } }),
      input: { mode: 'omitted', text: 'custom value retained while omitted' },
      onInputChange: (input) => onOmittedChange(input.mode === 'omitted'),
    })

    const input = screen.getByRole('textbox', { name: 'Origin' }) as HTMLInputElement
    const defaultControl = screen.getByRole('checkbox', { name: 'Use default for Origin' })

    expect(input.value).toBe('web')
    expect(input.disabled).toBe(true)
    expect(defaultControl.closest('[data-slot="input-group"]')?.contains(input)).toBe(true)

    fireEvent.click(defaultControl)
    expect(onOmittedChange).toHaveBeenCalledWith(false)
  })

  it('explains that DEFAULT uses the schema default', () => {
    renderMutationField({
      canOmit: true,
      column: column('origin', { type: 'Text' }, { default: { type: 'Text', value: 'web' } }),
      input: { mode: 'omitted', text: 'web' },
    })

    screen.getByRole('checkbox', {
      name: 'Use default for Origin',
      description:
        'Create this row with the default value: "web". Turn off DEFAULT to enter a different value.',
    })
  })

  it('explains that NULL bypasses the schema default', () => {
    renderMutationField({
      column: column(
        'origin',
        { type: 'Text' },
        { nullable: true, default: { type: 'Text', value: 'web' } },
      ),
      input: { mode: 'null', text: '' },
      initialValue: null,
    })

    screen.getByRole('checkbox', {
      name: 'Set Origin to NULL',
      description:
        'Schema default for new rows: "web". Editing this field changes this row only. Save this field as NULL, even when the schema defines a default. Turn off NULL to enter a value.',
    })
  })

  it('presents nullable structured fields as exclusive Value and NULL modes', () => {
    const onNullChange = vi.fn()

    const { container } = renderMutationField({
      column: column('settings', { type: 'Json' }, { nullable: true }),
      input: { mode: 'null', text: '{"enabled":true}' },
      initialValue: null,
      onInputChange: (input) => onNullChange(input.mode === 'null'),
    })

    expect(screen.getByRole('button', { name: 'NULL' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Value' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByRole('checkbox', { name: /settings/i })).toBeNull()
    const nullValue = screen.getByLabelText('Settings value: NULL')
    expect(nullValue.tagName).toBe('INPUT')
    expect(nullValue.getAttribute('data-size')).toBe('l')
    expect(nullValue.getAttribute('readonly')).not.toBeNull()
    expect(screen.queryByText('JSON')).toBeNull()
    expect(container.querySelector('#row-editor-settings')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Value' }))
    expect(onNullChange).toHaveBeenCalledWith(false)
  })

  it('replaces a nullable array editor with its NULL presentation', () => {
    const { container } = renderMutationField({
      column: column('items', { type: 'Array', element: { type: 'Text' } }, { nullable: true }),
      input: { mode: 'null', text: '["first"]' },
      initialValue: null,
    })

    expect(container.querySelector('#row-editor-items')).toBeNull()
    expect(screen.getByLabelText('Items value: NULL')).toBeTruthy()
    expect(screen.queryByText('ARRAY(TEXT)')).toBeNull()
  })

  it('adds Default to the structured value-mode selector when an insert can omit the field', () => {
    const onOmittedChange = vi.fn()

    renderMutationField({
      canOmit: true,
      column: column(
        'settings',
        { type: 'Json' },
        { nullable: true, default: { type: 'Text', value: '{"enabled":true}' } },
      ),
      input: { mode: 'omitted', text: '{}' },
      onInputChange: (input) => onOmittedChange(input.mode === 'omitted'),
    })

    expect(screen.getByRole('button', { name: 'Default' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect((screen.getByLabelText('Settings value: default') as HTMLInputElement).value).toContain(
      'enabled',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Value' }))
    expect(onOmittedChange).toHaveBeenCalledWith(false)
  })

  it('shows the schema default as reference information while editing an existing value', () => {
    render(
      <MutationField
        canOmit={false}
        column={column(
          'origin',
          { type: 'Text' },
          { default: { type: 'Text', value: 'user-created' } },
        )}
        error={undefined}
        expanded={false}
        input={{ mode: 'value', text: 'imported' }}
        hidden={false}
        initialValue="imported"
        onExpandedChange={vi.fn()}
        onInputChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    expect(
      screen.getByText(
        'Schema default for new rows: "user-created". Editing this field changes this row only.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: 'Use default for Origin' })).toBeNull()
  })

  it('lets a nullable Boolean leave NULL mode by selecting a value', () => {
    const onNullChange = vi.fn()
    const onTextChange = vi.fn()

    render(
      <MutationField
        canOmit={false}
        column={column('active', { type: 'Boolean' }, { nullable: true })}
        error={undefined}
        expanded={false}
        input={{ mode: 'null', text: '' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onInputChange={(input) => {
          onNullChange(input.mode === 'null')
          onTextChange(input.text)
        }}
        readOnlyReason={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'True' }))

    expect(onNullChange).toHaveBeenCalledWith(false)
    expect(onTextChange).toHaveBeenCalledWith('true')
  })

  it('keeps a nullable Enum select and NULL control in one input group', () => {
    function EnumField(): React.ReactElement {
      const [input, setInput] = useState<MutationFieldInput>({ mode: 'null', text: '' })
      return (
        <MutationField
          canOmit={false}
          column={column(
            'status',
            { type: 'Enum', variants: ['active', 'archived'] },
            { nullable: true },
          )}
          error={undefined}
          expanded={false}
          input={input}
          hidden={false}
          initialValue={null}
          onExpandedChange={vi.fn()}
          onInputChange={setInput}
          readOnlyReason={null}
        />
      )
    }

    render(<EnumField />)

    const select = screen.getByRole('combobox', { name: 'Status' }) as HTMLButtonElement
    const nullControl = screen.getByRole('checkbox', { name: 'Set Status to NULL' })
    const inputGroup = select.closest('[data-slot="input-group"]')

    expect(select.disabled).toBe(true)
    expect(inputGroup?.contains(nullControl)).toBe(true)

    fireEvent.click(nullControl)
    expect(select.disabled).toBe(false)
    expect(select.getAttribute('aria-expanded')).toBe('true')
  })

  it('presents timestamps with the shared calendar picker', async () => {
    const onTextChange = vi.fn()
    const initialDate = new Date(2024, 0, 2, 3, 4, 5, 678)

    render(
      <MutationField
        canOmit={false}
        column={column('createdAt', { type: 'Timestamp' })}
        error={undefined}
        expanded={false}
        input={{ mode: 'value', text: String(initialDate.getTime()) }}
        hidden={false}
        initialValue={initialDate.getTime()}
        onExpandedChange={vi.fn()}
        onInputChange={(input) => onTextChange(input.text)}
        readOnlyReason={null}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'CreatedAt' })
    const expectedText = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      second: '2-digit',
      year: 'numeric',
    }).format(initialDate)
    const time = screen.getByText(expectedText)
    expect(trigger.contains(time)).toBe(true)
    expect(time.getAttribute('datetime')).toBe(initialDate.toISOString())
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('button', { name: 'Apply' }))
    expect(onTextChange).toHaveBeenCalledWith(initialDate.toISOString())
  })

  it('presents a nullable timestamp as an empty input group while NULL is active', () => {
    render(
      <MutationField
        canOmit={false}
        column={column('publishedAt', { type: 'Timestamp' }, { nullable: true })}
        error={undefined}
        expanded={false}
        input={{ mode: 'null', text: '' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onInputChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'PublishedAt' }) as HTMLInputElement
    expect(input.disabled).toBe(true)
    expect(input.value).toBe('')
    expect(screen.getByRole('checkbox', { name: 'Set PublishedAt to NULL' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'PublishedAt' })).toBeNull()
  })

  it('presents an existing read-only binary value with copy formats and raw download', () => {
    render(
      <MutationField
        canOmit={false}
        column={column('state', { type: 'Bytea' })}
        error={undefined}
        expanded={false}
        input={{ mode: 'value', text: '(3 bytes)' }}
        hidden={false}
        initialValue={new Uint8Array([1, 2, 3])}
        onExpandedChange={vi.fn()}
        onInputChange={vi.fn()}
        readOnlyReason="binary"
      />,
    )

    const input = screen.getByRole('textbox', { name: 'State' }) as HTMLInputElement
    expect(input.value).toBe('3B')
    expect(input.getAttribute('data-font')).toBe('mono')
    expect(screen.getByRole('button', { name: 'Copy as' })).toBeTruthy()
  })

  it('leaves an empty required Boolean input unselected', () => {
    render(
      <MutationField
        canOmit={false}
        column={column('active', { type: 'Boolean' })}
        error={undefined}
        expanded={false}
        input={{ mode: 'value', text: '' }}
        hidden={false}
        initialValue={undefined}
        onExpandedChange={vi.fn()}
        onInputChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    expect(screen.getByRole('button', { name: 'True' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'False' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('describes an invalid Boolean control with its rendered guidance and error', () => {
    renderMutationField({
      column: column('active', { type: 'Boolean' }, { default: { type: 'Boolean', value: true } }),
      error: 'Choose a value.',
      input: { mode: 'value', text: '' },
      sourceUnavailable: true,
    })

    const control = screen.getByRole('group', {
      name: 'Active',
      description:
        'Unavailable source value. Schema default for new rows: true. Editing this field changes this row only. Choose a value.',
    })
    expect(control.getAttribute('aria-invalid')).toBe('true')
  })

  it('describes structured mode and editor controls with rendered guidance and errors', () => {
    renderMutationField({
      canOmit: true,
      column: column('settings', { type: 'Json' }, { default: { type: 'Text', value: '{}' } }),
      error: 'JSON value is invalid.',
      input: { mode: 'value', text: '{' },
    })

    const modeControl = screen.getByRole('group', {
      name: 'Settings value mode',
      description: 'Entered values override the schema default: {}.',
    })
    const editor = screen.getByRole('textbox', {
      name: 'Settings',
      description: 'Entered values override the schema default: {}. JSON value is invalid.',
    })

    expect(modeControl.getAttribute('aria-invalid')).toBeNull()
    expect(editor.getAttribute('aria-invalid')).toBe('true')
  })

  it('describes an invalid date trigger with rendered guidance and errors', () => {
    renderMutationField({
      column: column(
        'createdAt',
        { type: 'Timestamp' },
        { default: { type: 'Timestamp', value: 0 } },
      ),
      error: 'Choose a date.',
      input: { mode: 'value', text: '0' },
    })

    const trigger = screen.getByRole('button', {
      name: 'CreatedAt',
      description:
        /^Schema default for new rows: .+ Editing this field changes this row only\. Choose a date\./,
    })
    expect(trigger.getAttribute('aria-invalid')).toBe('true')
  })

  it('describes a read-only JSON tree when fallback rendering is required', () => {
    renderMutationField({
      column: column('settings', { type: 'Json' }),
      input: { mode: 'value', text: 'unavailable' },
      initialValue: new (class UnsupportedValue {})(),
      readOnlyReason: 'binary',
    })

    screen.getByRole('tree', {
      name: 'Settings value',
      description: 'Read-only: binary field',
    })
  })
})
