/**
 * Parses boolean-like Inspector form input shared by filters and mutations.
 *
 * Returning `null` lets schema-specific callers report the validation message that fits
 * the selected operator or column type.
 */
export function parseBooleanValue(value: string): boolean | null {
  const normalizedValue = value.trim().toLowerCase()

  if (normalizedValue === 'true' || normalizedValue === '1') {
    return true
  }

  if (normalizedValue === 'false' || normalizedValue === '0') {
    return false
  }

  return null
}

export function normalizeTimestampValue(value: Date | number | string): number | null {
  let candidate: number
  if (value instanceof Date) {
    candidate = value.getTime()
  } else if (typeof value === 'number') {
    candidate = value
  } else {
    const trimmedValue = value.trim()
    if (trimmedValue.length === 0) {
      return null
    }
    const numericValue = Number(trimmedValue)
    candidate = Number.isFinite(numericValue) === true ? numericValue : Date.parse(trimmedValue)
  }

  const epochMilliseconds = new Date(candidate).getTime()
  return Number.isFinite(epochMilliseconds) === true ? epochMilliseconds : null
}
