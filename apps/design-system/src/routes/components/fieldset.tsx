import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import FieldsetContent from '@/content/components/fieldset/page.mdx'
import { fieldsetItem } from '@/lib/registry'

export const Route = createFileRoute('/components/fieldset')({
  component: FieldsetPage,
  head: () => ({
    meta: [{ title: 'Fieldset · Inspektor Design System' }],
  }),
})

function FieldsetPage() {
  return (
    <ComponentPage item={fieldsetItem}>
      <FieldsetContent />
    </ComponentPage>
  )
}
