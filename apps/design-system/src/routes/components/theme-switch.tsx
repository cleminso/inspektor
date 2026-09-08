import { createFileRoute } from '@tanstack/react-router'

import { ThemeSwitchPage } from '@/components/content/components/themeSwitch/page'

export const Route = createFileRoute('/components/theme-switch')({
  component: ThemeSwitchPage,
  head: () => ({
    meta: [{ title: 'Theme Switch · Inspektor Design System' }],
  }),
})
