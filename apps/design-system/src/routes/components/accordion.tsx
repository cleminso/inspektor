import { createFileRoute } from '@tanstack/react-router'

import { AccordionPage } from '@/components/content/components/accordion/page'

export const Route = createFileRoute('/components/accordion')({
  component: AccordionPage,
  head: () => ({ meta: [{ title: 'Accordion · Inspector Design System' }] }),
})
