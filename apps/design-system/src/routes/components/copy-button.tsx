import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import CopyButtonContent from '@/content/components/copyButton/page.mdx'
import { copyButtonItem } from '@/lib/registry'

export const Route = createFileRoute('/components/copy-button')({
  component: CopyButtonPage,
  head: () => ({
    meta: [{ title: 'Copy Button · Inspektor Design System' }],
  }),
})

function CopyButtonPage() {
  return (
    <ComponentPage item={copyButtonItem}>
      <CopyButtonContent />
    </ComponentPage>
  )
}
