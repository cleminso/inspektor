import { createFileRoute } from '@tanstack/react-router'

import { FieldsetPage } from '@/components/content/components/fieldset/page'

export const Route = createFileRoute('/components/fieldset')({
  component: FieldsetPage,
  head: () => ({
    meta: [{ title: 'Fieldset · Inspector Design System' }],
  }),
})
