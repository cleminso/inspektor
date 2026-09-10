import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import TooltipContent from '@/content/components/tooltip/page.mdx'
import { tooltipItem } from '@/lib/registry'

export const Route = createFileRoute('/components/tooltip')({
  component: TooltipPage,
  head: () => ({ meta: [{ title: 'Tooltip · Inspektor Design System' }] }),
})

function TooltipPage() {
  return (
    <ComponentPage item={tooltipItem}>
      <TooltipContent />
    </ComponentPage>
  )
}
