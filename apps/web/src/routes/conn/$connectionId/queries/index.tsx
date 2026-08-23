import { createFileRoute } from '@tanstack/react-router'

import { QueriesView } from '@queries/view'

export const Route = createFileRoute('/conn/$connectionId/queries/')({
  component: QueriesView,
})
