import type { BinaryCopyFormat } from '@inspektor/ds'

import { encodeBinaryValue } from '@tables/rowEditor/values/binary'

export type CellCopyFormat = 'default' | BinaryCopyFormat

export interface SerializedCellValue {
  text: string
  toast: string
}

const binaryFormatLabels = {
  hex: 'Hex',
  base64: 'Base64',
} satisfies Record<BinaryCopyFormat, string>

function stringifyStructuredCellValue(value: object): string {
  try {
    const serializedValue = JSON.stringify(value, (_key, nestedValue: unknown) => {
      if (typeof nestedValue === 'bigint') {
        return String(nestedValue)
      }
      if (nestedValue instanceof Uint8Array) {
        return Array.from(nestedValue)
      }
      return nestedValue
    })
    if (serializedValue === undefined) {
      throw new Error('Cell value is unavailable.')
    }
    return serializedValue
  } catch {
    throw new Error('Cell value is unavailable.')
  }
}

/** Converts a raw runtime cell value into the text placed on the system clipboard. */
export function serializeCellValueForClipboard(
  value: unknown,
  format: CellCopyFormat = 'default',
): SerializedCellValue {
  if (value === undefined) {
    throw new Error('Cell value is unavailable.')
  }
  if (value instanceof Uint8Array) {
    const binaryFormat = format === 'default' ? 'hex' : format
    return {
      text: encodeBinaryValue(value, binaryFormat),
      toast: `Cell value copied as ${binaryFormatLabels[binaryFormat]}`,
    }
  }
  if (value === null) {
    return { text: 'NULL', toast: 'Cell value copied' }
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()) === true) {
      throw new Error('Cell value is unavailable.')
    }
    return { text: value.toISOString(), toast: 'Cell value copied' }
  }
  if (typeof value === 'object') {
    return { text: stringifyStructuredCellValue(value), toast: 'Cell value copied' }
  }
  return { text: String(value), toast: 'Cell value copied' }
}
