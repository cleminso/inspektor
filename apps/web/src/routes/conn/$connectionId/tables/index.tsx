import { useEffect } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'
import { useAvailableTables } from '@tables/schema/useAvailableTables'

export const Route = createFileRoute('/conn/$connectionId/tables/')({
  component: TablesRoute,
})

function TablesRoute(): null {
  const navigate = useNavigate()
  const params = Route.useParams()
  const search = useSearch({ strict: false }) as { empty?: string }
  const { isSchemaReady, tables } = useAvailableTables()

  useEffect(() => {
    if (search.empty === 'true' || isSchemaReady === false || tables.length === 0) {
      return
    }

    void navigate({
      to: appRoutes.table,
      params: {
        connectionId: params.connectionId,
        tableName: tables[0],
      },
      replace: true,
    })
  }, [isSchemaReady, navigate, params, search.empty, tables])

  return null
}
