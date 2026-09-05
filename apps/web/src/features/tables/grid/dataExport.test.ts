import { describe, expect, it } from 'vitest'

import { createDataExport } from './dataExport'

const columns = [
  { accessorKey: 'name', label: 'Name' },
  { accessorKey: 'note', label: 'Note' },
  { accessorKey: 'metadata', label: 'Metadata' },
]

describe('data export', () => {
  it('creates CSV from the supplied visible columns and escapes special cells', () => {
    expect(
      createDataExport('csv', columns, [
        {
          metadata: new Date('2026-06-25T14:59:15.777Z'),
          name: 'Ada, "A"',
          note: 'line one\nline two',
        },
        { metadata: { active: true }, name: null, note: undefined },
      ]),
    ).toBe(
      'Name,Note,Metadata\r\n"Ada, ""A""","line one\nline two",2026-06-25T14:59:15.777Z\r\nNULL,,"{""active"":true}"',
    )
  })

  it('creates indented JSON with visible column labels and JSON-safe values', () => {
    expect(
      createDataExport('json', columns, [
        { metadata: { active: true }, name: 'Ada', note: undefined },
        { metadata: 7n, name: 'Grace', note: null },
      ]),
    ).toBe(`[
  {
    "Name": "Ada",
    "Note": null,
    "Metadata": {
      "active": true
    }
  },
  {
    "Name": "Grace",
    "Note": null,
    "Metadata": "7"
  }
]`)
  })

  it('creates one JSON-safe row per NDJSON line', () => {
    expect(
      createDataExport('ndjson', columns, [
        { metadata: { active: true }, name: 'Ada', note: undefined },
        { metadata: 7n, name: 'Grace', note: null },
      ]),
    ).toBe(
      '{"Name":"Ada","Note":null,"Metadata":{"active":true}}\n{"Name":"Grace","Note":null,"Metadata":"7"}',
    )
  })
})
