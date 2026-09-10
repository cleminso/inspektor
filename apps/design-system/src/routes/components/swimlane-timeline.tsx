import { createFileRoute } from '@tanstack/react-router'

import { ComponentPage } from '@/components/docs/componentPage'
import SwimlaneTimelineContent from '@/content/components/swimlaneTimeline/page.mdx'
import { swimlaneTimelineItem } from '@/lib/registry'

export const Route = createFileRoute('/components/swimlane-timeline')({
  component: SwimlaneTimelinePage,
  head: () => ({ meta: [{ title: 'Swimlane Timeline · Inspektor Design System' }] }),
})

function SwimlaneTimelinePage() {
  return (
    <ComponentPage item={swimlaneTimelineItem}>
      <SwimlaneTimelineContent />
    </ComponentPage>
  )
}
