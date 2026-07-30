import { createFileRoute } from '@tanstack/react-router'

import { DataGridPage } from '@/components/content/components/dataGrid/page'

export const Route = createFileRoute('/components/data-table')({
  component: DataGridPage,
  head: () => ({ meta: [{ title: 'Data Grid · Inspector Design System' }] }),
})
