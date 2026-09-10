import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import ShellLayoutContent from '@/content/components/shellLayout/page.mdx'
import { shellLayoutItem } from '@/lib/registry'

export const Route = createFileRoute('/components/shell-layout')({
  component: ShellLayoutPage,
  head: () => ({
    meta: [{ title: 'Shell Layout · Inspektor Design System' }],
  }),
})

function ShellLayoutPage() {
  return (
    <ComponentPage item={shellLayoutItem}>
      <ShellLayoutContent />
    </ComponentPage>
  )
}
