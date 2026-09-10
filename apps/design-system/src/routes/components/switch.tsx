import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import SwitchContent from '@/content/components/switch/page.mdx'
import { switchItem } from '@/lib/registry'

export const Route = createFileRoute('/components/switch')({
  component: SwitchPage,
  head: () => ({ meta: [{ title: 'Switch · Inspektor Design System' }] }),
})

function SwitchPage() {
  return (
    <ComponentPage item={switchItem}>
      <SwitchContent />
    </ComponentPage>
  )
}
