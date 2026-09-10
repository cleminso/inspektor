import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import AccordionContent from '@/content/components/accordion/page.mdx'
import { accordionItem } from '@/lib/registry'

export const Route = createFileRoute('/components/accordion')({
  component: AccordionPage,
  head: () => ({
    meta: [{ title: 'Accordion · Inspektor Design System' }],
  }),
})

function AccordionPage() {
  return (
    <ComponentPage item={accordionItem}>
      <AccordionContent />
    </ComponentPage>
  )
}
