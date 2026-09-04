import { createFileRoute } from '@tanstack/react-router'
import { DataGridFilterClausePage } from '@/components/content/components/dataGridFilterClause/page'
export const Route = createFileRoute('/components/data-grid-filter-clause')({
  component: DataGridFilterClausePage,
  head: () => ({ meta: [{ title: 'Data Grid Filter Clause · Inspektor Design System' }] }),
})
