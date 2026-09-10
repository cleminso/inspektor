import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import InputContent from '@/content/components/input/page.mdx'
import { inputItem } from '@/lib/registry'

export const Route = createFileRoute('/components/input')({
  component: InputPage,
  head: () => ({
    meta: [{ title: 'Input · Inspektor Design System' }],
  }),
})

function InputPage() {
  return (
    <ComponentPage item={inputItem}>
      <InputContent />
    </ComponentPage>
  )
}
