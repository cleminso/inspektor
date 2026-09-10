import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ThemeSwitchContent from '@/content/components/themeSwitch/page.mdx'
import { themeSwitchItem } from '@/lib/registry'

export const Route = createFileRoute('/components/theme-switch')({
  component: ThemeSwitchPage,
  head: () => ({ meta: [{ title: 'Theme Switch · Inspektor Design System' }] }),
})

function ThemeSwitchPage() {
  return (
    <ComponentPage item={themeSwitchItem}>
      <ThemeSwitchContent />
    </ComponentPage>
  )
}
