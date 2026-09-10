import { ThemeSwitch } from '@inspektor/ds'
import { useTheme } from 'next-themes'
import { type ReactElement } from 'react'

export default function ThemeSwitchControlledDemo(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <ThemeSwitch
      theme={theme}
      onThemeChange={setTheme}
    />
  )
}
