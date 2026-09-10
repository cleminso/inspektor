import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import DataGridContent from '@/content/components/dataGrid/page.mdx'
import { dataGridItem } from '@/lib/registry'

export const Route = createFileRoute('/components/data-grid')({
  component: DataGridPage,
  head: () => ({ meta: [{ title: 'Data Grid · Inspektor Design System' }] }),
})

function DataGridPage() {
  return (
    <ComponentPage item={dataGridItem}>
      <DataGridContent />
    </ComponentPage>
  )
}
