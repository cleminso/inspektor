import { createFileRoute } from '@tanstack/react-router'

import { formatStudioDocumentTitle } from '@shared/documentTitle'

export const Route = createFileRoute('/conn/$connectionId/tables/$tableName/')({
  head: ({ params }) => ({
    meta: [{ title: formatStudioDocumentTitle(params.tableName) }],
  }),
  component: TableDataRoute,
})

function TableDataRoute(): null {
  return null
}
