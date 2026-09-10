import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import MenuContent from '@/content/components/menu/page.mdx'
import { menuItem } from '@/lib/registry'

export const Route = createFileRoute('/components/menu')({
  component: MenuPage,
  head: () => ({ meta: [{ title: 'Menu · Inspektor Design System' }] }),
})

function MenuPage() {
  return (
    <ComponentPage item={menuItem}>
      <MenuContent />
    </ComponentPage>
  )
}
