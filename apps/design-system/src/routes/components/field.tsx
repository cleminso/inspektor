import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import FieldContent from '@/content/components/field/page.mdx'
import { fieldItem } from '@/lib/registry'

export const Route = createFileRoute('/components/field')({
  component: FieldPage,
  head: () => ({
    meta: [{ title: 'Field · Inspektor Design System' }],
  }),
})

function FieldPage() {
  return (
    <ComponentPage item={fieldItem}>
      <FieldContent />
    </ComponentPage>
  )
}
