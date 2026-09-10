import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import RelationValueContent from '@/content/components/relationValue/page.mdx'
import { relationValueItem } from '@/lib/registry'

export const Route = createFileRoute('/components/relation-value')({
  component: RelationValuePage,
  head: () => ({ meta: [{ title: 'Relation Value · Inspektor Design System' }] }),
})

function RelationValuePage() {
  return (
    <ComponentPage item={relationValueItem}>
      <RelationValueContent />
    </ComponentPage>
  )
}
