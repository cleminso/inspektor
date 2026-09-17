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
  document
    .querySelectorAll('link[rel="icon"][data-inspektor-theme-icon="true"]')
    .forEach((themeIcon) => themeIcon.remove())
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

  it.each([
    ['dark', '/conn/favicon-dark.svg'],
    ['light', '/conn/favicon-light.svg'],
  ])('synchronizes the %s favicon from the resolved theme', (theme, faviconHref) => {
    const themeIcon = document.createElement('link')
    themeIcon.rel = 'icon'
    themeIcon.dataset.inspektorThemeIcon = 'true'
    document.head.append(themeIcon)
    resolvedTheme = theme

    render(<ThemeMetadata />)

    expect(themeIcon.getAttribute('href')).toBe(faviconHref)
  })

  it('updates the favicon when the resolved theme changes', () => {
    const themeIcon = document.createElement('link')
    themeIcon.rel = 'icon'
    themeIcon.dataset.inspektorThemeIcon = 'true'
    document.head.append(themeIcon)
    resolvedTheme = 'dark'

    const { rerender } = render(<ThemeMetadata />)
    expect(themeIcon.getAttribute('href')).toBe('/conn/favicon-dark.svg')

    resolvedTheme = 'light'
    rerender(<ThemeMetadata />)

    expect(themeIcon.getAttribute('href')).toBe('/conn/favicon-light.svg')
  })

  it('preserves system favicon fallbacks before the theme resolves', () => {
    const lightThemeIcon = document.createElement('link')
    lightThemeIcon.rel = 'icon'
    lightThemeIcon.href = '/conn/favicon-light.svg'
    lightThemeIcon.media = '(prefers-color-scheme: light)'
    lightThemeIcon.dataset.inspektorThemeIcon = 'true'
    const darkThemeIcon = document.createElement('link')
    darkThemeIcon.rel = 'icon'
    darkThemeIcon.href = '/conn/favicon-dark.svg'
    darkThemeIcon.media = '(prefers-color-scheme: dark)'
    darkThemeIcon.dataset.inspektorThemeIcon = 'true'
    document.head.append(lightThemeIcon, darkThemeIcon)

    render(<ThemeMetadata />)

    expect(lightThemeIcon.getAttribute('href')).toBe('/conn/favicon-light.svg')
    expect(lightThemeIcon.media).toBe('(prefers-color-scheme: light)')
    expect(darkThemeIcon.getAttribute('href')).toBe('/conn/favicon-dark.svg')
    expect(darkThemeIcon.media).toBe('(prefers-color-scheme: dark)')
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

  it('replaces system favicon fallbacks with one resolved theme icon', () => {
    const lightThemeIcon = document.createElement('link')
    lightThemeIcon.rel = 'icon'
    lightThemeIcon.href = '/conn/favicon-light.svg'
    lightThemeIcon.media = '(prefers-color-scheme: light)'
    lightThemeIcon.dataset.inspektorThemeIcon = 'true'
    const darkThemeIcon = document.createElement('link')
    darkThemeIcon.rel = 'icon'
    darkThemeIcon.href = '/conn/favicon-dark.svg'
    darkThemeIcon.media = '(prefers-color-scheme: dark)'
    darkThemeIcon.dataset.inspektorThemeIcon = 'true'
    document.head.append(lightThemeIcon, darkThemeIcon)
    resolvedTheme = 'dark'

    render(<ThemeMetadata />)

    const themeIcons = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"][data-inspektor-theme-icon="true"]',
    )
    expect(themeIcons).toHaveLength(1)
    expect(themeIcons[0]?.getAttribute('href')).toBe('/conn/favicon-dark.svg')
    expect(themeIcons[0]?.hasAttribute('media')).toBe(false)
  })
})
