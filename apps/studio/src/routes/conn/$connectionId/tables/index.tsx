import { createFileRoute } from '@tanstack/react-router'

import { TablesIndexRoute } from './-tablesIndexRoute'

export const Route = createFileRoute('/conn/$connectionId/tables/')({
  component: TablesIndexRoute,
})
