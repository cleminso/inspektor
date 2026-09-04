import { createFileRoute } from '@tanstack/react-router'

import { AlertDialogPage } from '@/components/content/components/alertDialog/page'

export const Route = createFileRoute('/components/alert-dialog')({
  component: AlertDialogPage,
  head: () => ({ meta: [{ title: 'Alert Dialog · Inspektor Design System' }] }),
})
