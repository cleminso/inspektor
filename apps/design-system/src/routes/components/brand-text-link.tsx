import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import BrandTextLinkContent from '@/content/components/brandTextLink/page.mdx'
import { brandTextLinkItem } from '@/lib/registry'

export const Route = createFileRoute('/components/brand-text-link')({
  component: BrandTextLinkPage,
  head: () => ({ meta: [{ title: 'Brand Text Link · Inspektor Design System' }] }),
})

function BrandTextLinkPage() {
  return (
    <ComponentPage item={brandTextLinkItem}>
      <BrandTextLinkContent />
    </ComponentPage>
  )
}
