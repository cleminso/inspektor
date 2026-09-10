import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ComboboxContent from '@/content/components/combobox/page.mdx'
import { comboboxItem } from '@/lib/registry'

export const Route = createFileRoute('/components/combobox')({
  component: ComboboxPage,
  head: () => ({ meta: [{ title: 'Combobox · Inspektor Design System' }] }),
})

function ComboboxPage() {
  return (
    <ComponentPage item={comboboxItem}>
      <ComboboxContent />
    </ComponentPage>
  )
}
