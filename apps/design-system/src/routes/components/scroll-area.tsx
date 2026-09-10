import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ScrollAreaContent from '@/content/components/scrollArea/page.mdx'
import { scrollAreaItem } from '@/lib/registry'

export const Route = createFileRoute('/components/scroll-area')({
  component: ScrollAreaPage,
  head: () => ({ meta: [{ title: 'Scroll Area · Inspektor Design System' }] }),
})

function ScrollAreaPage() {
  return (
    <ComponentPage item={scrollAreaItem}>
      <ScrollAreaContent />
    </ComponentPage>
  )
}
