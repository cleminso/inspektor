import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

const bootstrapPath = resolve(process.cwd(), 'public/theme-bootstrap.js')
const bootstrapSource = readFileSync(bootstrapPath, 'utf8')

function runThemeBootstrap({
  storedTheme,
  systemDark,
  storageThrows = false,
}: {
  storedTheme?: string
  systemDark: boolean
  storageThrows?: boolean
}): { classes: Set<string>; colorScheme: string } {
  const classes = new Set(['light', 'dark'])
  const style = { colorScheme: '' }
  runInNewContext(bootstrapSource, {
    document: {
      documentElement: {
        classList: {
          add: (...values: string[]) => values.forEach((value) => classes.add(value)),
          remove: (...values: string[]) => values.forEach((value) => classes.delete(value)),
        },
        style,
      },
    },
    window: {
      localStorage: {
        getItem: () => {
          if (storageThrows === true) throw new Error('Storage blocked')
          return storedTheme
        },
      },
      matchMedia: () => ({ matches: systemDark }),
    },
  })
  return { classes, colorScheme: style.colorScheme }
}

describe('theme bootstrap', () => {
  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
    [undefined, true, 'dark'],
    ['unsupported', false, 'light'],
  ] as const)(
    'resolves stored %s with system dark %s to %s',
    (storedTheme, systemDark, expected) => {
      const result = runThemeBootstrap({ storedTheme, systemDark })

      expect(result.classes).toEqual(new Set([expected]))
      expect(result.colorScheme).toBe(expected)
    },
  )

  it('loads before the application entry point from the configured base path', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const bootstrapIndex = html.indexOf('%BASE_URL%theme-bootstrap.js')
    const applicationIndex = html.indexOf('/src/app.tsx')

    expect(bootstrapIndex).toBeGreaterThan(-1)
    expect(bootstrapIndex).toBeLessThan(applicationIndex)
    expect(html).toContain('background: #0a0a0a')
  })

  it('falls back to the system theme when storage access is blocked', () => {
    const result = runThemeBootstrap({ storageThrows: true, systemDark: true })

    expect(result.classes).toEqual(new Set(['dark']))
    expect(result.colorScheme).toBe('dark')
  })
})
