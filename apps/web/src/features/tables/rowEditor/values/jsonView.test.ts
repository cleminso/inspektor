import type { ColumnDescriptor } from 'jazz-tools'
import { describe, expect, it } from 'vitest'

import { createColumnJsonViewValue, createRowJsonViewValue } from './jsonView'

const scalarColumns = [
  { name: 'name', column_type: { type: 'Text' }, nullable: false },
  { name: 'age', column_type: { type: 'Integer' }, nullable: false },
  { name: 'active', column_type: { type: 'Boolean' }, nullable: false },
  { name: 'nickname', column_type: { type: 'Text' }, nullable: true },
] satisfies ColumnDescriptor[]

describe('createRowJsonViewValue', () => {
  it('projects id first and fields in schema order', () => {
    const value = createRowJsonViewValue(
      {
        active: true,
        age: 37,
        extra: 'not in the schema',
        id: 'person-1',
        name: 'Ada',
        nickname: null,
      },
      scalarColumns,
    )

    expect(Object.keys(value)).toEqual(['id', 'name', 'age', 'active', 'nickname'])
    expect(value).toEqual({
      id: 'person-1',
      name: 'Ada',
      age: 37,
      active: true,
      nickname: null,
    })
  })

  it('represents missing schema fields explicitly', () => {
    expect(createRowJsonViewValue({ id: 'person-1', name: 'Ada' }, scalarColumns)).toEqual({
      id: 'person-1',
      name: 'Ada',
      age: { $type: 'unavailable' },
      active: { $type: 'unavailable' },
      nickname: { $type: 'unavailable' },
    })
  })

  it('converts Date timestamps to canonical ISO strings', () => {
    const columns = [
      { name: 'createdAt', column_type: { type: 'Timestamp' }, nullable: false },
    ] satisfies ColumnDescriptor[]

    expect(
      createRowJsonViewValue(
        { id: 'event-1', createdAt: new Date('2026-04-05T06:07:08.009Z') },
        columns,
      ),
    ).toEqual({ id: 'event-1', createdAt: '2026-04-05T06:07:08.009Z' })
  })

  it('encodes bytes without exposing Uint8Array indexed properties', () => {
    const columns = [
      { name: 'payload', column_type: { type: 'Bytea' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    const value = createRowJsonViewValue(
      { id: 'file-1', payload: new Uint8Array([0, 1, 254, 255]) },
      columns,
    )

    expect(value).toEqual({
      id: 'file-1',
      payload: { $type: 'bytes', encoding: 'base64', value: 'AAH+/w==' },
    })
    expect(value.payload).not.toHaveProperty('0')
  })

  it('encodes bytes above the clipboard limit', () => {
    const value = new Uint8Array(1_048_577)
    value[0] = 255

    const normalized = createColumnJsonViewValue(value, { type: 'Bytea' })

    if (
      normalized === null ||
      typeof normalized !== 'object' ||
      Array.isArray(normalized) === true
    ) {
      throw new Error('Expected normalized bytes')
    }
    expect(normalized).toMatchObject({ $type: 'bytes', encoding: 'base64' })
    if (typeof normalized.value !== 'string') {
      throw new Error('Expected normalized base64 bytes')
    }
    expect(normalized.value).toHaveLength(1_398_104)
    expect(normalized.value).toMatch(/^\/wAA/)
  })

  it('preserves stored reference IDs', () => {
    const columns = [
      {
        name: 'ownerId',
        column_type: { type: 'Uuid' },
        nullable: false,
        references: 'users',
      },
    ] satisfies ColumnDescriptor[]

    expect(createRowJsonViewValue({ id: 'post-1', ownerId: 'user-42' }, columns)).toEqual({
      id: 'post-1',
      ownerId: 'user-42',
    })
  })

  it('preserves array order and normalizes array values', () => {
    const columns = [
      {
        name: 'scores',
        column_type: { type: 'Array', element: { type: 'Double' } },
        nullable: false,
      },
    ] satisfies ColumnDescriptor[]

    expect(createRowJsonViewValue({ id: 'result-1', scores: [3, null, 1] }, columns)).toEqual({
      id: 'result-1',
      scores: [3, null, 1],
    })
  })

  it('recursively preserves JSON objects, arrays, primitives, and null', () => {
    const columns = [
      { name: 'metadata', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    const metadata = {
      flags: [true, false, null],
      nested: { count: 2, label: 'saved' },
    }

    expect(createRowJsonViewValue({ id: 'item-1', metadata }, columns)).toEqual({
      id: 'item-1',
      metadata,
    })
  })

  it('maps Row tuples to their descriptor metadata', () => {
    const addressColumns = [
      { name: 'street', column_type: { type: 'Text' }, nullable: false },
      { name: 'postalCode', column_type: { type: 'Integer' }, nullable: false },
    ] satisfies ColumnDescriptor[]
    const columns = [
      {
        name: 'address',
        column_type: { type: 'Row', columns: addressColumns },
        nullable: false,
      },
    ] satisfies ColumnDescriptor[]

    expect(
      createRowJsonViewValue(
        { id: 'person-1', address: ['Analytical Engine Way', 10101] },
        columns,
      ),
    ).toEqual({
      id: 'person-1',
      address: { street: 'Analytical Engine Way', postalCode: 10101 },
    })
  })

  it.each([
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'Infinity'],
    [Number.NEGATIVE_INFINITY, '-Infinity'],
  ])('tags the non-finite number %s', (number, label) => {
    const columns = [
      { name: 'measurement', column_type: { type: 'Double' }, nullable: false },
    ] satisfies ColumnDescriptor[]

    expect(createRowJsonViewValue({ id: 'sample-1', measurement: number }, columns)).toEqual({
      id: 'sample-1',
      measurement: { $type: 'non-finite-number', value: label },
    })
  })

  it('tags class instances instead of exposing implementation properties', () => {
    class CustomValue {
      internal = 'hidden'
    }
    const columns = [
      { name: 'metadata', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]

    expect(createRowJsonViewValue({ id: 'item-1', metadata: new CustomValue() }, columns)).toEqual({
      id: 'item-1',
      metadata: { $type: 'unsupported', valueType: 'object' },
    })
  })

  it.each([
    [1n, 'bigint'],
    [Symbol('private'), 'symbol'],
    [() => undefined, 'function'],
  ])('tags unsupported %s values', (unsupported, valueType) => {
    const columns = [
      { name: 'metadata', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]

    expect(createRowJsonViewValue({ id: 'item-1', metadata: unsupported }, columns)).toEqual({
      id: 'item-1',
      metadata: { $type: 'unsupported', valueType },
    })
  })

  it('tags cycles instead of recursing indefinitely', () => {
    const metadata: Record<string, unknown> = { label: 'cycle' }
    metadata.self = metadata
    const columns = [
      { name: 'metadata', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]

    expect(createRowJsonViewValue({ id: 'item-1', metadata }, columns)).toEqual({
      id: 'item-1',
      metadata: { label: 'cycle', self: { $type: 'circular-reference' } },
    })
  })

  it('does not mutate the source row or nested values', () => {
    const payload = new Uint8Array([1, 2, 3])
    const metadata = { labels: ['one', 'two'] }
    const row = { id: 'item-1', metadata, payload }
    const columns = [
      { name: 'payload', column_type: { type: 'Bytea' }, nullable: false },
      { name: 'metadata', column_type: { type: 'Json' }, nullable: false },
    ] satisfies ColumnDescriptor[]

    createRowJsonViewValue(row, columns)

    expect(row).toEqual({ id: 'item-1', metadata: { labels: ['one', 'two'] }, payload })
    expect(row.metadata).toBe(metadata)
    expect(row.payload).toBe(payload)
  })
})
