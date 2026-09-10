import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TreeContent from '@/content/components/tree/page.mdx'
import { treeItem } from '@/lib/registry'

export const Route = createFileRoute('/components/tree')({
  component: TreePage,
  head: () => ({ meta: [{ title: 'Tree · Inspektor Design System' }] }),
})

function TreePage() {
  return (
    <ComponentPage item={treeItem}>
      <TreeContent />
    </ComponentPage>
  )
}
