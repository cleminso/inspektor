import { createFileRoute } from '@tanstack/react-router'
import { SelectPage } from '@/components/content/components/select/page'

export const Route = createFileRoute('/components/select')({
  component: SelectPage,
  head: () => ({ meta: [{ title: 'Select · Inspektor Design System' }] }),
})
