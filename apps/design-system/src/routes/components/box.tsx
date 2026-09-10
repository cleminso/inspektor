import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import BoxContent from '@/content/components/box/page.mdx'
import { boxItem } from '@/lib/registry'

export const Route = createFileRoute('/components/box')({
  component: BoxPage,
  head: () => ({ meta: [{ title: 'Box · Inspektor Design System' }] }),
})

function BoxPage() {
  return (
    <ComponentPage item={boxItem}>
      <BoxContent />
    </ComponentPage>
  )
}
