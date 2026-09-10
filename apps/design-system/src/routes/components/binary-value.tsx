import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import BinaryValueContent from '@/content/components/binaryValue/page.mdx'
import { binaryValueItem } from '@/lib/registry'

export const Route = createFileRoute('/components/binary-value')({
  component: BinaryValuePage,
  head: () => ({ meta: [{ title: 'Binary Value · Inspektor Design System' }] }),
})

function BinaryValuePage() {
  return (
    <ComponentPage item={binaryValueItem}>
      <BinaryValueContent />
    </ComponentPage>
  )
}
