import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ButtonContent from '@/content/components/button/page.mdx'
import { buttonItem } from '@/lib/registry'

export const Route = createFileRoute('/components/button')({
  component: ButtonPage,
  head: () => ({
    meta: [{ title: 'Button · Inspektor Design System' }],
  }),
})

function ButtonPage() {
  return (
    <ComponentPage item={buttonItem}>
      <ButtonContent />
    </ComponentPage>
  )
}
