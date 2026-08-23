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
