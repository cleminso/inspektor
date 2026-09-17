import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import BrandButtonLinkContent from '@/content/components/brandButtonLink/page.mdx'
import { brandButtonLinkItem } from '@/lib/registry'

export const Route = createFileRoute('/components/brand-button-link')({
  component: BrandButtonLinkPage,
  head: () => ({ meta: [{ title: 'Brand Button Link · Inspektor Design System' }] }),
})

function BrandButtonLinkPage() {
  return (
    <ComponentPage item={brandButtonLinkItem}>
      <BrandButtonLinkContent />
    </ComponentPage>
  )
}
