import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import InputGroupContent from '@/content/components/inputGroup/page.mdx'
import { inputGroupItem } from '@/lib/registry'

export const Route = createFileRoute('/components/input-group')({
  component: InputGroupPage,
  head: () => ({
    meta: [{ title: 'Input Group · Inspektor Design System' }],
  }),
})

function InputGroupPage() {
  return (
    <ComponentPage item={inputGroupItem}>
      <InputGroupContent />
    </ComponentPage>
  )
}
