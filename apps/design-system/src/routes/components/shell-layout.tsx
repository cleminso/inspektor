import { createFileRoute } from '@tanstack/react-router'

import { ShellLayoutPage } from '@/components/content/components/shellLayout/page'

export const Route = createFileRoute('/components/shell-layout')({
  component: ShellLayoutPage,
  head: () => ({
    meta: [{ title: 'Shell Layout · Inspector Design System' }],
  }),
})
