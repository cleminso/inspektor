import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/conn/$connectionId/tables/$tableName/')({
  head: ({ params }) => ({
    meta: [{ title: `${params.tableName} | Inspector` }],
  }),
  component: TableDataRoute,
})

function TableDataRoute(): null {
  return null
}
