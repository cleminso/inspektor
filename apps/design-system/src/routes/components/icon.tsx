import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import IconContent from '@/content/components/icon/page.mdx'
import { iconItem } from '@/lib/registry'

export const Route = createFileRoute('/components/icon')({
  component: IconPage,
  head: () => ({ meta: [{ title: 'Icon · Inspektor Design System' }] }),
})

function IconPage() {
  return (
    <ComponentPage item={iconItem}>
      <IconContent />
    </ComponentPage>
  )
}
