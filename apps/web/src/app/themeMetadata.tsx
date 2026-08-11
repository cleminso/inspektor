import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const themeColors = {
  dark: '#0a0a0a',
  light: '#fafafa',
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
  }, [resolvedTheme])

  return null
}
