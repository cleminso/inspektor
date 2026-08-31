import { createFileRoute } from '@tanstack/react-router'

import { SwimlaneTimelinePage } from '@/components/content/components/swimlaneTimeline/page'

export const Route = createFileRoute('/components/swimlane-timeline')({
  component: SwimlaneTimelinePage,
  head: () => ({ meta: [{ title: 'Swimlane Timeline · Inspector Design System' }] }),
})
