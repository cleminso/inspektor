import { createFileRoute } from '@tanstack/react-router'

import { ScrollAreaPage } from '@/components/content/components/scrollArea/page'

export const Route = createFileRoute('/components/scroll-area')({
  component: ScrollAreaPage,
  head: () => ({ meta: [{ title: 'Scroll Area · Inspektor Design System' }] }),
})
