import { useTheme } from 'next-themes'
import { useEffect } from 'react'

const themeColors = {
  dark: '#262626',
  light: '#e5e5e5',
} as const

const faviconHrefs = {
  dark: '/favicon-dark.svg',
  light: '/favicon-light.svg',
} as const

export function ThemeMetadata(): null {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (resolvedTheme !== 'dark' && resolvedTheme !== 'light') {
      return
    }

    const [themeColor, ...fallbackThemeColors] = document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    if (themeColor !== undefined) {
      themeColor.content = themeColors[resolvedTheme]
      themeColor.removeAttribute('media')
    }
    for (const fallbackThemeColor of fallbackThemeColors) {
      fallbackThemeColor.remove()
    }

    const [themeIcon, ...fallbackThemeIcons] = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"][data-inspektor-theme-icon="true"]',
    )
    if (themeIcon !== undefined) {
      themeIcon.href = faviconHrefs[resolvedTheme]
      themeIcon.removeAttribute('media')
    }
    for (const fallbackThemeIcon of fallbackThemeIcons) {
      fallbackThemeIcon.remove()
    }
  }, [resolvedTheme])

  return null
}
