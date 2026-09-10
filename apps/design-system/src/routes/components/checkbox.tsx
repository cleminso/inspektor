import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import CheckboxContent from '@/content/components/checkbox/page.mdx'
import { checkboxItem } from '@/lib/registry'

export const Route = createFileRoute('/components/checkbox')({
  component: CheckboxPage,
  head: () => ({ meta: [{ title: 'Checkbox · Inspektor Design System' }] }),
})

function CheckboxPage() {
  return (
    <ComponentPage item={checkboxItem}>
      <CheckboxContent />
    </ComponentPage>
  )
}
