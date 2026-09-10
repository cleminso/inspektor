import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import CheckboxGroupContent from '@/content/components/checkboxGroup/page.mdx'
import { checkboxGroupItem } from '@/lib/registry'

export const Route = createFileRoute('/components/checkbox-group')({
  component: CheckboxGroupPage,
  head: () => ({ meta: [{ title: 'Checkbox Group · Inspektor Design System' }] }),
})

function CheckboxGroupPage() {
  return (
    <ComponentPage item={checkboxGroupItem}>
      <CheckboxGroupContent />
    </ComponentPage>
  )
}
