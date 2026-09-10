import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import MiddleTruncateContent from '@/content/components/middleTruncate/page.mdx'
import { middleTruncateItem } from '@/lib/registry'

export const Route = createFileRoute('/components/middle-truncate')({
  component: MiddleTruncatePage,
  head: () => ({
    meta: [{ title: 'Middle Truncate · Inspektor Design System' }],
  }),
})

function MiddleTruncatePage() {
  return (
    <ComponentPage item={middleTruncateItem}>
      <MiddleTruncateContent />
    </ComponentPage>
  )
}
