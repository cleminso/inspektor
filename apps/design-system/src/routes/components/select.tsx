import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import SelectContent from '@/content/components/select/page.mdx'
import { selectItem } from '@/lib/registry'

export const Route = createFileRoute('/components/select')({
  component: SelectPage,
  head: () => ({ meta: [{ title: 'Select · Inspektor Design System' }] }),
})

function SelectPage() {
  return (
    <ComponentPage item={selectItem}>
      <SelectContent />
    </ComponentPage>
  )
}
