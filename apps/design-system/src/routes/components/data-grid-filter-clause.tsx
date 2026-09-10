import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import DataGridFilterClauseContent from '@/content/components/dataGridFilterClause/page.mdx'
import { dataGridFilterClauseItem } from '@/lib/registry'

export const Route = createFileRoute('/components/data-grid-filter-clause')({
  component: DataGridFilterClausePage,
  head: () => ({ meta: [{ title: 'Data Grid Filter Clause · Inspektor Design System' }] }),
})

function DataGridFilterClausePage() {
  return (
    <ComponentPage item={dataGridFilterClauseItem}>
      <DataGridFilterClauseContent />
    </ComponentPage>
  )
}
