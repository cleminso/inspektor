import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDescriptor } from 'jazz-tools'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MutationField } from '@tables/rowEditor/mutationField'

vi.mock('@app/providers/inspectorProvider', () => ({
  useInspectorSessionState: () => ({
    currentBranch: 'main',
    currentConnectionId: 'connection-1',
    currentSchemaHash: 'schema-1',
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: React.ComponentProps<'a'>) => <a href="/relation">{children}</a>,
}))

afterEach(cleanup)

function column(
  name: string,
  columnType: ColumnDescriptor['column_type'],
  options: Partial<ColumnDescriptor> = {},
): ColumnDescriptor {
  return { column_type: columnType, name, nullable: false, ...options } as ColumnDescriptor
}

describe('MutationField', () => {
  it('places the column type at the trailing edge of the field header', () => {
    render(
      <MutationField
        canOmit={false}
        column={column('roomId', { type: 'Uuid' }, { references: 'rooms' })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: false, text: 'room-1' }}
        hidden={false}
        initialValue="room-1"
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    const type = screen.getByText('UUID')
    const header = type.closest('[data-slot="mutation-field-header"]')

    expect(header?.lastElementChild).toBe(type)
    expect(header === null ? null : getComputedStyle(header).width).toBe('100%')
  })

  it('keeps relation navigation inside the value input group', () => {
    render(
      <MutationField
        canOmit={false}
        column={column('roomId', { type: 'Uuid' }, { references: 'rooms' })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: false, text: 'room-1' }}
        hidden={false}
        initialValue="room-1"
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'RoomId' })
    const targetLink = screen.getByRole('link', { name: 'Open target' })
    expect(input.closest('[data-slot="input-group"]')?.contains(targetLink)).toBe(true)
    expect(input.getAttribute('data-font')).toBe('mono')
    expect(screen.queryByRole('link', { name: 'Show' })).toBeNull()
  })

  it('shows the concrete schema default with its control inside the input group', () => {
    const onOmittedChange = vi.fn()

    render(
      <MutationField
        canOmit
        column={column('origin', { type: 'Text' }, { default: { type: 'Text', value: 'web' } })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: true, text: 'custom value retained while omitted' }}
        hidden={false}
        initialValue={undefined}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={onOmittedChange}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Origin' }) as HTMLInputElement
    const defaultControl = screen.getByRole('checkbox', { name: 'Use default for Origin' })

    expect(input.value).toBe('web')
    expect(input.disabled).toBe(true)
    expect(defaultControl.closest('[data-slot="input-group"]')?.contains(input)).toBe(true)

    fireEvent.click(defaultControl)
    expect(onOmittedChange).toHaveBeenCalledWith(false)
  })

  it('explains that DEFAULT uses the schema default', () => {
    render(
      <MutationField
        canOmit
        column={column('origin', { type: 'Text' }, { default: { type: 'Text', value: 'web' } })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: true, text: 'web' }}
        hidden={false}
        initialValue={undefined}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    const defaultControl = screen
      .getByRole('checkbox', { name: 'Use default for Origin' })
      .closest('[data-slot="input-group-checkbox"]')
    if (defaultControl === null) throw new Error('Expected DEFAULT input-group control.')
    expect(defaultControl.getAttribute('aria-description')).toBe(
      'Create this row with the default value: "web". Turn off DEFAULT to enter a different value.',
    )
  })

  it('explains that NULL bypasses the schema default', () => {
    render(
      <MutationField
        canOmit={false}
        column={column(
          'origin',
          { type: 'Text' },
          { nullable: true, default: { type: 'Text', value: 'web' } },
        )}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: true, isOmitted: false, text: '' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    const nullControl = screen
      .getByRole('checkbox', { name: 'Set Origin to NULL' })
      .closest('[data-slot="input-group-checkbox"]')
    if (nullControl === null) throw new Error('Expected NULL input-group control.')
    expect(nullControl.getAttribute('aria-description')).toBe(
      'Save this field as NULL, even when the schema defines a default. Turn off NULL to enter a value.',
    )
  })

  it('presents nullable structured fields as exclusive Value and NULL modes', () => {
    const onNullChange = vi.fn()

    const { container } = render(
      <MutationField
        canOmit={false}
        column={column('settings', { type: 'Json' }, { nullable: true })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: true, isOmitted: false, text: '{"enabled":true}' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onNullChange={onNullChange}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

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
    const { container } = render(
      <MutationField
        canOmit={false}
        column={column('items', { type: 'Array', element: { type: 'Text' } }, { nullable: true })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: true, isOmitted: false, text: '["first"]' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

    expect(container.querySelector('#row-editor-items')).toBeNull()
    expect(screen.getByLabelText('Items value: NULL')).toBeTruthy()
    expect(screen.queryByText('ARRAY(TEXT)')).toBeNull()
  })

  it('adds Default to the structured value-mode selector when an insert can omit the field', () => {
    const onOmittedChange = vi.fn()

    render(
      <MutationField
        canOmit
        column={column(
          'settings',
          { type: 'Json' },
          { nullable: true, default: { type: 'Text', value: '{"enabled":true}' } },
        )}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: true, text: '{}' }}
        hidden={false}
        initialValue={undefined}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={onOmittedChange}
        onTextChange={vi.fn()}
        readOnlyReason={null}
      />,
    )

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
        fieldState={{ isNull: false, isOmitted: false, text: 'imported' }}
        hidden={false}
        initialValue="imported"
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
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
        fieldState={{ isNull: true, isOmitted: false, text: '' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onNullChange={onNullChange}
        onOmittedChange={vi.fn()}
        onTextChange={onTextChange}
        readOnlyReason={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'True' }))

    expect(onNullChange).toHaveBeenCalledWith(false)
    expect(onTextChange).toHaveBeenCalledWith('true')
  })

  it('presents timestamps with the shared calendar picker', () => {
    const onTextChange = vi.fn()
    const initialDate = new Date(2024, 0, 2, 3, 4, 5, 678)

    render(
      <MutationField
        canOmit={false}
        column={column('createdAt', { type: 'Timestamp' })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: false, isOmitted: false, text: String(initialDate.getTime()) }}
        hidden={false}
        initialValue={initialDate.getTime()}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={onTextChange}
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
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onTextChange).toHaveBeenCalledWith(initialDate.toISOString())
  })

  it('presents a nullable timestamp as an empty input group while NULL is active', () => {
    render(
      <MutationField
        canOmit={false}
        column={column('publishedAt', { type: 'Timestamp' }, { nullable: true })}
        error={undefined}
        expanded={false}
        fieldState={{ isNull: true, isOmitted: false, text: '' }}
        hidden={false}
        initialValue={null}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
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
        fieldState={{ isNull: false, isOmitted: false, text: '(3 bytes)' }}
        hidden={false}
        initialValue={new Uint8Array([1, 2, 3])}
        onExpandedChange={vi.fn()}
        onNullChange={vi.fn()}
        onOmittedChange={vi.fn()}
        onTextChange={vi.fn()}
        readOnlyReason="binary"
      />,
    )

    const input = screen.getByRole('textbox', { name: 'State' }) as HTMLInputElement
    expect(input.value).toBe('3B')
    expect(input.getAttribute('data-font')).toBe('mono')
    expect(screen.getByRole('button', { name: 'Copy as' })).toBeTruthy()
  })
})
