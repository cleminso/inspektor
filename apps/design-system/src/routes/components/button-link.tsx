import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ButtonLinkContent from '@/content/components/buttonLink/page.mdx'
import { buttonLinkItem } from '@/lib/registry'

export const Route = createFileRoute('/components/button-link')({
  component: ButtonLinkPage,
  head: () => ({ meta: [{ title: 'Button Link · Inspektor Design System' }] }),
})

function ButtonLinkPage() {
  return (
    <ComponentPage item={buttonLinkItem}>
      <ButtonLinkContent />
    </ComponentPage>
  )
}
