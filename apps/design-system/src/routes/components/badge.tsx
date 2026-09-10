import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import BadgeContent from '@/content/components/badge/page.mdx'
import { badgeItem } from '@/lib/registry'

export const Route = createFileRoute('/components/badge')({
  component: BadgePage,
  head: () => ({ meta: [{ title: 'Badge · Inspektor Design System' }] }),
})

function BadgePage() {
  return (
    <ComponentPage item={badgeItem}>
      <BadgeContent />
    </ComponentPage>
  )
}
