import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { useEffect, type ComponentProps, type ReactElement } from 'react'

export type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

interface ThemeRestorationProps {
  storageKey: string
}

function ThemeRestoration({ storageKey }: ThemeRestorationProps): null {
  const { setTheme } = useTheme()

  useEffect(() => {
    const restoreTheme = () => {
      try {
        const storedTheme = window.localStorage.getItem(storageKey)
        if (storedTheme !== null) {
          setTheme(storedTheme)
        }
      } catch {
        return
      }
    }

    window.addEventListener('pageshow', restoreTheme)
    return () => window.removeEventListener('pageshow', restoreTheme)
  }, [setTheme, storageKey])

  return null
}

/** Adds history-restoration synchronization to next-themes. */
export function ThemeProvider({
  children,
  storageKey = 'theme',
  ...props
}: ThemeProviderProps): ReactElement {
  return (
    <NextThemesProvider
      {...props}
      storageKey={storageKey}
    >
      <ThemeRestoration storageKey={storageKey} />
      {children}
    </NextThemesProvider>
  )
}
