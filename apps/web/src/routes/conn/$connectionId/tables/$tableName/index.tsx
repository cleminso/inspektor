import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/conn/$connectionId/tables/$tableName/')({
  head: ({ params }) => ({
    meta: [{ title: `${params.tableName} | Inspektor` }],
  }),
  component: TableDataRoute,
})

function TableDataRoute(): null {
  return null
}
