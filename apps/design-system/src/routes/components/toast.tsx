import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ToastContent from '@/content/components/toast/page.mdx'
import { toastItem } from '@/lib/registry'

export const Route = createFileRoute('/components/toast')({
  component: ToastPage,
  head: () => ({ meta: [{ title: 'Toast · Inspektor Design System' }] }),
})

function ToastPage() {
  return (
    <ComponentPage item={toastItem}>
      <ToastContent />
    </ComponentPage>
  )
}
