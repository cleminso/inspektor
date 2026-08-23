import { createFileRoute } from '@tanstack/react-router'

import { CalendarPage } from '@/components/content/components/calendar/page'

export const Route = createFileRoute('/components/calendar')({
  component: CalendarPage,
  head: () => ({ meta: [{ title: 'Calendar · Inspector Design System' }] }),
})
