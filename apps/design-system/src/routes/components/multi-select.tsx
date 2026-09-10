import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import MultiSelectContent from '@/content/components/multiSelect/page.mdx'
import { multiSelectItem } from '@/lib/registry'

export const Route = createFileRoute('/components/multi-select')({
  component: MultiSelectPage,
  head: () => ({ meta: [{ title: 'Multi Select · Inspektor Design System' }] }),
})

function MultiSelectPage() {
  return (
    <ComponentPage item={multiSelectItem}>
      <MultiSelectContent />
    </ComponentPage>
  )
}
