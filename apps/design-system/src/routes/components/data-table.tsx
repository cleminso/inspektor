import { createFileRoute } from '@tanstack/react-router'

import { DataTablePage } from '@/components/content/components/dataTable/page'

export const Route = createFileRoute('/components/data-table')({
  component: DataTablePage,
  head: () => ({ meta: [{ title: 'Data Table · Inspector Design System' }] }),
})
