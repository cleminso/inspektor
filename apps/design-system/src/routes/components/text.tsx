import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TextContent from '@/content/components/text/page.mdx'
import { textItem } from '@/lib/registry'

export const Route = createFileRoute('/components/text')({
  component: TextPage,
  head: () => ({
    meta: [{ title: 'Text · Inspektor Design System' }],
  }),
})

function TextPage() {
  return (
    <ComponentPage item={textItem}>
      <TextContent />
    </ComponentPage>
  )
}
