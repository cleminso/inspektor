import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { CodeEditorProps } from '@inspector/ds'
import type { ColumnDescriptor } from 'jazz-tools'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EditRowForm as ControlledEditRowForm } from '@tables/rowEditor/editForm'
import { focusRowEditorField } from '@tables/rowEditor/fieldFocus'
import {
  useRowDraftController,
  type RowDraftController,
} from '@tables/rowEditor/mutation/useRowDraftController'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: React.ComponentProps<'a'>) => <a href="/relation">{children}</a>,
}))

vi.mock('@inspector/ds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inspector/ds')>()

  return {
    ...actual,
    CodeEditor: ({
      describedBy,
      disabled = false,
      expanded = false,
      id,
      invalid = false,
      labelledBy,
      onExpandedChange,
      onValueChange,
      value,
    }: CodeEditorProps) => (
      <>
        <div
          id={id}
          aria-describedby={describedBy}
          aria-disabled={disabled}
          aria-invalid={invalid}
          aria-labelledby={labelledBy}
          role="textbox"
          tabIndex={disabled === true ? -1 : 0}
          onInput={(event) => {
            onValueChange?.(event.currentTarget.textContent ?? '')
          }}
        >
          {value}
        </div>
        {disabled === false ? (
          <button
            type="button"
            aria-label={expanded === true ? 'Collapse code editor' : 'Expand code editor'}
            onClick={() => {
              onExpandedChange?.(expanded === false)
            }}
          />
        ) : null}
      </>
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

const schemaColumns = [
  { name: 'displayName', column_type: { type: 'Text' }, nullable: false },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
  { name: 'active', column_type: { type: 'Boolean' }, nullable: false },
] satisfies ColumnDescriptor[]

type EditRowFormProps = Omit<
  React.ComponentProps<typeof ControlledEditRowForm>,
  'draftController' | 'onRepresentationChange' | 'representation'
> & {
  draftController?: RowDraftController
}

function EditRowForm({ draftController, ...props }: EditRowFormProps): React.ReactElement {
  const [representation, setRepresentation] = useState<'details' | 'json'>('details')
  const ownedDraftController = useRowDraftController({
    initialRowValues: props.rowValues,
    mode: 'edit',
    schemaColumns: props.schemaColumns,
  })
  return (
    <ControlledEditRowForm
      {...props}
      draftController={draftController ?? ownedDraftController}
      onRepresentationChange={setRepresentation}
      representation={representation}
    />
  )
}

const rowValues = {
  active: true,
  displayName: 'Ada.Lovelace',
  id: 'person-1',
}

function renderEditRowForm() {
  return render(<EditRowForm rowValues={rowValues} schemaColumns={schemaColumns} />)
}

function submitEditRowForm(): void {
  const form = document.querySelector('form')
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Expected the edit row form to be rendered')
  }
  fireEvent.submit(form)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('focusRowEditorField', () => {
  it('focuses the first control inside the requested row field', () => {
    const field = document.createElement('div')
    const input = document.createElement('input')
    field.id = 'row-editor-field-displayName'
    field.append(input)
    document.body.append(field)

    expect(focusRowEditorField('displayName')).toBe(true)
    expect(document.activeElement).toBe(input)

    field.remove()
  })

  it('reports when a requested row field has no focusable control', () => {
    const field = document.createElement('div')
    field.id = 'row-editor-field-settings'
    field.dataset.valueMode = 'value'
    document.body.append(field)

    expect(focusRowEditorField('settings')).toBe(false)

    field.remove()
  })

  it('focuses the value-mode control while a structured field is NULL', () => {
    const field = document.createElement('div')
    field.id = 'row-editor-field-settings'
    field.dataset.valueMode = 'null'
    const hiddenEditor = document.createElement('div')
    hiddenEditor.hidden = true
    const textbox = document.createElement('div')
    textbox.setAttribute('role', 'textbox')
    textbox.tabIndex = 0
    hiddenEditor.append(textbox)
    const valueModeControl = document.createElement('button')
    valueModeControl.dataset.valueModeControl = ''
    valueModeControl.type = 'button'
    field.append(hiddenEditor, valueModeControl)
    document.body.append(field)

    expect(focusRowEditorField('settings')).toBe(true)
    expect(document.activeElement).toBe(valueModeControl)

    field.remove()
  })

  it('focuses the value-mode control while a structured field uses its default', () => {
    const field = document.createElement('div')
    field.id = 'row-editor-field-settings'
    field.dataset.valueMode = 'omitted'
    const valueModeControl = document.createElement('button')
    valueModeControl.dataset.valueModeControl = ''
    valueModeControl.type = 'button'
    field.append(valueModeControl)
    document.body.append(field)

    expect(focusRowEditorField('settings')).toBe(true)
    expect(document.activeElement).toBe(valueModeControl)

    field.remove()
  })
})

describe('EditRowForm Details and JSON views', () => {
  it('selects Details by default', () => {
    renderEditRowForm()

    expect(screen.getByRole('group', { name: 'Row representation' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Details' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: 'JSON' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByLabelText('DisplayName')).toBeTruthy()
  })

  it('renders the complete row in schema order and marks missing fields unavailable', () => {
    renderEditRowForm()

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))

    const json = screen.getByRole('tree')
    const rowFields = within(json)
      .getAllByRole('treeitem')
      .filter((item) => item.getAttribute('aria-level') === '2')

    expect(rowFields.map((item) => item.getAttribute('aria-label'))).toEqual([
      'id: person-1',
      'displayName: Ada.Lovelace',
      'age: object',
      'active: true',
    ])
    fireEvent.click(within(json).getByRole('button', { name: 'Expand age' }))
    expect(within(json).getByRole('treeitem', { name: '$type: unavailable' })).toBeTruthy()
  })

  it('marks a missing Details value unavailable without turning it into NULL intent', () => {
    renderEditRowForm()

    expect(screen.getByText('Unavailable source value.')).toBeTruthy()
    const age = screen.getByLabelText('Age') as HTMLInputElement
    expect(age.disabled).toBe(false)
    expect(age.value).toBe('')
  })

  it('shows JSON tools without visible mutation controls', () => {
    renderEditRowForm()

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))

    expect(screen.getByRole('searchbox', { name: 'Find in row JSON' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous match' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next match' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'DisplayName' })).toBeNull()
  })

  it('preserves edited Details text after switching to JSON and back', () => {
    renderEditRowForm()
    const displayName = screen.getByLabelText('DisplayName')

    fireEvent.change(displayName, { target: { value: 'Grace Hopper' } })
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))

    expect((screen.getByLabelText('DisplayName') as HTMLInputElement).value).toBe('Grace Hopper')
  })

  it('projects valid staged Details values into the JSON representation', () => {
    renderEditRowForm()
    fireEvent.change(screen.getByLabelText('DisplayName'), { target: { value: 'Grace Hopper' } })

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))

    expect(screen.getByRole('treeitem', { name: 'displayName: Grace Hopper' })).toBeTruthy()
  })

  it('retains invalid raw input and reports its error', async () => {
    render(
      <EditRowForm
        rowValues={{ id: 'person-1', displayName: 'Ada', age: 37, active: true }}
        schemaColumns={schemaColumns}
      />,
    )
    const age = screen.getByLabelText('Age') as HTMLInputElement

    fireEvent.change(age, { target: { value: 'not-a-number' } })
    submitEditRowForm()

    expect(await screen.findByText('Value must be an integer.')).toBeTruthy()
    expect(age.value).toBe('not-a-number')
  })

  it('highlights and reports a literal JSON find query', async () => {
    const { container } = renderEditRowForm()
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))

    fireEvent.change(screen.getByRole('searchbox', { name: 'Find in row JSON' }), {
      target: { value: '.' },
    })

    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      '.',
    ])
    expect(await screen.findByRole('status', { name: 'Match 1 of 1' })).toBeTruthy()
    expect(container.querySelector('mark')?.hasAttribute('data-active')).toBe(true)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Find in row JSON' }), {
      target: { value: 'missing' },
    })
    expect(await screen.findByRole('status', { name: 'No matches' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Next match' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })

  it('applies Find Bar query options to row JSON matches', async () => {
    renderEditRowForm()
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))

    fireEvent.change(screen.getByRole('searchbox', { name: 'Find in row JSON' }), {
      target: { value: 'ada' },
    })
    expect(await screen.findByRole('status', { name: 'Match 1 of 1' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Match case' }))

    expect(screen.getByRole('button', { name: 'Match case' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect(await screen.findByRole('status', { name: 'No matches' })).toBeTruthy()
  })

  it('copies the pretty normalized row JSON', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderEditRowForm()
    fireEvent.click(screen.getByRole('button', { name: 'JSON' }))

    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))

    expect(writeText).toHaveBeenCalledWith(
      [
        '{',
        '  "id": "person-1",',
        '  "displayName": "Ada.Lovelace",',
        '  "age": {',
        '    "$type": "unavailable"',
        '  },',
        '  "active": true',
        '}',
      ].join('\n'),
    )
  })

  it('uses a bounded CodeEditor marker for a read-only structured field containing binary values', () => {
    const binaryArrayColumns = [
      {
        name: 'payloads',
        column_type: { type: 'Array', element: { type: 'Bytea' } },
        nullable: false,
      },
    ] satisfies ColumnDescriptor[]
    render(
      <EditRowForm
        rowValues={{ id: 'file-1', payloads: [new Uint8Array([0, 1, 2])] }}
        schemaColumns={binaryArrayColumns}
      />,
    )

    const editor = screen.getByRole('textbox', { name: 'Payloads' })
    expect(editor.textContent).toContain('"$type": "bytes"')
    expect(editor.textContent).toContain('"byteLength": 3')
    expect(editor.textContent).not.toContain('"0": 0')
    expect(screen.queryByRole('tree', { name: 'Payloads value' })).toBeNull()
  })

  it('enables a NULL relation control after switching back to a value', () => {
    const columns = [
      {
        name: 'accountId',
        column_type: { type: 'Uuid' },
        nullable: true,
        references: 'accounts',
      },
    ] satisfies ColumnDescriptor[]
    render(<EditRowForm rowValues={{ id: 'profile-1', accountId: null }} schemaColumns={columns} />)

    const input = screen.getByLabelText('AccountId') as HTMLInputElement
    expect(input.disabled).toBe(true)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Set AccountId to NULL' }))
    expect(input.disabled).toBe(false)
    fireEvent.change(input, { target: { value: 'account-2' } })
    expect(input.value).toBe('account-2')
  })

  it('focuses an editable structured value when its label is clicked', async () => {
    const columns = [
      { name: 'settings', column_type: { type: 'Json' }, nullable: true },
    ] satisfies ColumnDescriptor[]
    render(<EditRowForm rowValues={{ id: 'profile-1', settings: {} }} schemaColumns={columns} />)
    const editor = await screen.findByRole('textbox', { name: 'Settings' })

    fireEvent.click(screen.getByText('Settings'))

    expect(document.activeElement).toBe(editor)
  })

  it('focuses the value-mode control from a NULL structured field label', () => {
    const columns = [
      { name: 'settings', column_type: { type: 'Json' }, nullable: true },
    ] satisfies ColumnDescriptor[]
    render(<EditRowForm rowValues={{ id: 'profile-1', settings: null }} schemaColumns={columns} />)
    const valueModeControl = screen.getByRole('button', { name: 'NULL' })

    fireEvent.click(screen.getByText('Settings'))

    expect(document.activeElement).toBe(valueModeControl)
  })

  it('preserves structured source changes while typing', async () => {
    const jsonColumns = [
      { name: 'settings', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    render(
      <EditRowForm
        rowValues={{ id: 'profile-1', settings: { enabled: true } }}
        schemaColumns={jsonColumns}
      />,
    )
    const editor = await screen.findByRole('textbox', { name: 'Settings' })

    fireEvent.input(editor, { target: { textContent: '{"enabled":false}' } })

    expect(editor.textContent).toBe('{"enabled":false}')
  })

  it('shows explicit NULL for nullable JSON and restores its source draft', async () => {
    const jsonColumns = [
      { name: 'settings', column_type: { type: 'Json' }, nullable: true },
    ] satisfies ColumnDescriptor[]
    const { container } = render(
      <EditRowForm
        rowValues={{ id: 'profile-1', settings: { enabled: true } }}
        schemaColumns={jsonColumns}
      />,
    )

    const nullToggle = screen.getByRole('button', { name: 'NULL' })
    const editor = await screen.findByRole('textbox', { name: 'Settings' })
    expect(editor.textContent).toContain('"enabled"')

    fireEvent.click(nullToggle)

    expect(container.contains(editor)).toBe(false)
    expect(screen.getByLabelText('Settings value: NULL')).toBeTruthy()
    expect(focusRowEditorField('settings')).toBe(true)
    expect(document.activeElement).toBe(nullToggle)

    fireEvent.click(screen.getByRole('button', { name: 'Value' }))

    const restoredEditor = await screen.findByRole('textbox', { name: 'Settings' })
    expect(restoredEditor.textContent).toContain('"enabled"')
  })

  it('associates a structured field error and focuses the first invalid editor', async () => {
    const scrollIntoView = vi.fn()
    const columns = [
      {
        name: 'items',
        column_type: { type: 'Array', element: { type: 'Text' } },
        nullable: false,
      },
    ] satisfies ColumnDescriptor[]
    const { container } = render(
      <EditRowForm rowValues={{ id: 'row-1', items: [] }} schemaColumns={columns} />,
    )
    const field = container.querySelector<HTMLElement>('#row-editor-field-items')
    Object.defineProperty(field, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    const editor = await screen.findByRole('textbox', { name: 'Items' })
    fireEvent.input(editor, { target: { textContent: '{}' } })

    submitEditRowForm()

    const error = await screen.findByText('Array must be valid JSON array.')
    await waitFor(() => {
      expect(document.activeElement).toBe(editor)
    })
    expect(editor.getAttribute('aria-describedby')).toBe(error.id)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('collapses an expanded structured editor before focusing a sibling error', async () => {
    const columns = [
      { name: 'age', column_type: { type: 'Integer' }, nullable: false },
      { name: 'settings', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    render(
      <EditRowForm
        rowValues={{ id: 'profile-1', age: 37, settings: { enabled: true } }}
        schemaColumns={columns}
      />,
    )
    const age = screen.getByLabelText('Age')
    await screen.findByRole('textbox', { name: 'Settings' })
    fireEvent.change(age, { target: { value: 'not-a-number' } })

    fireEvent.click(screen.getByRole('button', { name: 'Expand code editor' }))

    submitEditRowForm()

    await waitFor(() => {
      expect(document.activeElement).toBe(age)
    })
    expect(age.closest('[hidden]')).toBeNull()
  })
})
