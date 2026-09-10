import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import CommandContent from '@/content/components/command/page.mdx'
import { commandItem } from '@/lib/registry'

export const Route = createFileRoute('/components/command')({
  component: CommandPage,
  head: () => ({ meta: [{ title: 'Command · Inspektor Design System' }] }),
})

function CommandPage() {
  return (
    <ComponentPage item={commandItem}>
      <CommandContent />
    </ComponentPage>
  )
}
