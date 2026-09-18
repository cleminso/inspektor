import { createFileRoute } from '@tanstack/react-router'

import { LiveQueriesView } from '@liveQueries/view'

export const Route = createFileRoute('/conn/$connectionId/live-queries/')({
  component: LiveQueriesView,
})
