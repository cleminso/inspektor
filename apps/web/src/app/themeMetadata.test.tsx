import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeMetadata } from './themeMetadata'

let resolvedTheme: string | undefined

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme }),
}))

afterEach(() => {
  cleanup()
  document.querySelectorAll('meta[name="theme-color"]').forEach((themeColor) => themeColor.remove())
  resolvedTheme = undefined
})

describe('ThemeMetadata', () => {
  it('synchronizes dark browser chrome metadata from the resolved theme', () => {
    const themeColor = document.createElement('meta')
    themeColor.name = 'theme-color'
    document.head.append(themeColor)
    resolvedTheme = 'dark'

    render(<ThemeMetadata />)

    expect(themeColor.content).toBe('#0a0a0a')
  })

  it('does not override prepaint metadata before the theme resolves', () => {
    const themeColor = document.createElement('meta')
    themeColor.name = 'theme-color'
    themeColor.content = 'prepaint'
    document.head.append(themeColor)

    render(<ThemeMetadata />)

    expect(themeColor.content).toBe('prepaint')
  })

  it('replaces system fallbacks with one resolved theme color', () => {
    const lightThemeColor = document.createElement('meta')
    lightThemeColor.name = 'theme-color'
    lightThemeColor.media = '(prefers-color-scheme: light)'
    const darkThemeColor = document.createElement('meta')
    darkThemeColor.name = 'theme-color'
    darkThemeColor.media = '(prefers-color-scheme: dark)'
    document.head.append(lightThemeColor, darkThemeColor)
    resolvedTheme = 'light'

    render(<ThemeMetadata />)

    const themeColors = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    expect(themeColors).toHaveLength(1)
    expect(themeColors[0]?.content).toBe('#fafafa')
    expect(themeColors[0]?.hasAttribute('media')).toBe(false)
  })
})
