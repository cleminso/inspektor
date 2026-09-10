import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import WorkspaceTabsContent from '@/content/components/workspaceTabs/page.mdx'
import { workspaceTabsItem } from '@/lib/registry'

export const Route = createFileRoute('/components/workspace-tabs')({
  component: WorkspaceTabsPage,
  head: () => ({ meta: [{ title: 'Workspace Tabs · Inspektor Design System' }] }),
})

function WorkspaceTabsPage() {
  return (
    <ComponentPage item={workspaceTabsItem}>
      <WorkspaceTabsContent />
    </ComponentPage>
  )
}
