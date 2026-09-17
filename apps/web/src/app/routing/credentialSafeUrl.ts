const SENSITIVE_PARAMETER_NAME = 'adminsecret'

interface UrlParts {
  pathname: string
  search: string
  hash: string
}

export function getCredentialSafeRelativeUrl({ pathname, search, hash }: UrlParts): string {
  return `${pathname}${sanitizeParameterString(search, '?')}${sanitizeHash(hash)}`
}

export function sanitizeCurrentCredentialUrl(): void {
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const safeUrl = getCredentialSafeRelativeUrl(window.location)
  if (safeUrl !== currentUrl) {
    window.history.replaceState(window.history.state, '', safeUrl)
  }
}

function sanitizeHash(hash: string): string {
  if (hash.length === 0) return ''
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  const decodedValue = decodeHash(value)
  const candidate = containsSensitiveParameter(decodedValue) === true ? decodedValue : value
  const queryIndex = candidate.indexOf('?')
  if (queryIndex >= 0) {
    const path = candidate.slice(0, queryIndex)
    const query = sanitizeParameterString(candidate.slice(queryIndex + 1), '?')
    return `#${path}${query}`
  }
  if (candidate.includes('=') === false) return `#${candidate}`
  return sanitizeParameterString(candidate, '#')
}

function decodeHash(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function containsSensitiveParameter(value: string): boolean {
  const queryIndex = value.indexOf('?')
  const query = queryIndex >= 0 ? value.slice(queryIndex + 1) : value
  if (query.includes('=') === false) return false
  return Array.from(new URLSearchParams(query).keys()).some(
    (key) => key.toLowerCase() === SENSITIVE_PARAMETER_NAME,
  )
}

function sanitizeParameterString(value: string, prefix: '?' | '#'): string {
  if (value.length === 0) return ''
  const raw = value.startsWith(prefix) ? value.slice(1) : value
  const params = new URLSearchParams(raw)
  let changed = false
  for (const key of Array.from(params.keys())) {
    if (key.toLowerCase() === SENSITIVE_PARAMETER_NAME) {
      params.delete(key)
      changed = true
    }
  }
  if (changed === false) return value.startsWith(prefix) ? value : `${prefix}${value}`
  const sanitized = params.toString()
  return sanitized.length === 0 ? '' : `${prefix}${sanitized}`
}
