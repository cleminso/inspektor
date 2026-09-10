import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ColorsContent from '@/content/foundations/colors/page.mdx'
import { colorsFoundationItem } from '@/lib/registry'

export const Route = createFileRoute('/foundations/colors')({
  component: ColorsPage,
  head: () => ({
    meta: [{ title: 'Colors · Inspektor Design System' }],
  }),
})

function ColorsPage() {
  return (
    <ComponentPage item={colorsFoundationItem}>
      <ColorsContent />
    </ComponentPage>
  )
}
