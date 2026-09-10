import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TypographyContent from '@/content/foundations/typography/page.mdx'
import { typographyFoundationItem } from '@/lib/registry'

export const Route = createFileRoute('/foundations/typography')({
  component: TypographyPage,
  head: () => ({
    meta: [{ title: 'Typography · Inspektor Design System' }],
  }),
})

function TypographyPage() {
  return (
    <ComponentPage item={typographyFoundationItem}>
      <TypographyContent />
    </ComponentPage>
  )
}
