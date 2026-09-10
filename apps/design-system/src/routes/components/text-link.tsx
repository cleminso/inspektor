import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TextLinkContent from '@/content/components/textLink/page.mdx'
import { textLinkItem } from '@/lib/registry'

export const Route = createFileRoute('/components/text-link')({
  component: TextLinkPage,
  head: () => ({ meta: [{ title: 'Text Link · Inspektor Design System' }] }),
})

function TextLinkPage() {
  return (
    <ComponentPage item={textLinkItem}>
      <TextLinkContent />
    </ComponentPage>
  )
}
