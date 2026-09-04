import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceTabsPage } from '@/components/content/components/workspaceTabs/page'

export const Route = createFileRoute('/components/workspace-tabs')({
  component: WorkspaceTabsPage,
  head: () => ({
    meta: [{ title: 'Workspace Tabs · Inspektor Design System' }],
  }),
})
