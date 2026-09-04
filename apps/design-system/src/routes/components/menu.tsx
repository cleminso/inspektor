import { createFileRoute } from '@tanstack/react-router'
import { MenuPage } from '@/components/content/components/menu/page'

export const Route = createFileRoute('/components/menu')({
  component: MenuPage,
  head: () => ({ meta: [{ title: 'Menu · Inspektor Design System' }] }),
})
