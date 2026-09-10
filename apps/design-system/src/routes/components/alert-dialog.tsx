import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import AlertDialogContent from '@/content/components/alertDialog/page.mdx'
import { alertDialogItem } from '@/lib/registry'

export const Route = createFileRoute('/components/alert-dialog')({
  component: AlertDialogPage,
  head: () => ({ meta: [{ title: 'Alert Dialog · Inspektor Design System' }] }),
})

function AlertDialogPage() {
  return (
    <ComponentPage item={alertDialogItem}>
      <AlertDialogContent />
    </ComponentPage>
  )
}
