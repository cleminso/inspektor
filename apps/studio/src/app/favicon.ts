type FaviconTheme = 'dark' | 'light'

function getFaviconPrefix(mode: string | undefined): string {
  return mode === 'development' ? 'favicon-dev' : mode === 'preview' ? 'favicon-preview' : 'favicon'
}

export function getFaviconHref(mode: string | undefined, theme: FaviconTheme): string {
  return `/conn/${getFaviconPrefix(mode)}-${theme}.svg`
}
