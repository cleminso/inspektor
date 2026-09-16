import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import BrandWordmarkContent from '@/content/components/brandWordmark/page.mdx'
import { brandWordmarkItem } from '@/lib/registry'

export const Route = createFileRoute('/components/brand-wordmark')({
  component: BrandWordmarkPage,
  head: () => ({ meta: [{ title: 'Brand Wordmark · Inspektor Design System' }] }),
})

function BrandWordmarkPage() {
  return (
    <ComponentPage item={brandWordmarkItem}>
      <BrandWordmarkContent />
    </ComponentPage>
  )
}
