import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import FindBarContent from '@/content/components/findBar/page.mdx'
import { findBarItem } from '@/lib/registry'

export const Route = createFileRoute('/components/find-bar')({
  component: FindBarPage,
  head: () => ({
    meta: [{ title: 'Find Bar · Inspektor Design System' }],
  }),
})

function FindBarPage() {
  return (
    <ComponentPage item={findBarItem}>
      <FindBarContent />
    </ComponentPage>
  )
}
