import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import SpinnerContent from '@/content/components/spinner/page.mdx'
import { spinnerItem } from '@/lib/registry'

export const Route = createFileRoute('/components/spinner')({
  component: SpinnerPage,
  head: () => ({ meta: [{ title: 'Spinner · Inspektor Design System' }] }),
})

function SpinnerPage() {
  return (
    <ComponentPage item={spinnerItem}>
      <SpinnerContent />
    </ComponentPage>
  )
}
