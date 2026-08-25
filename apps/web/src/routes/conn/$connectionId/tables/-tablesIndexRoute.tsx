// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { useEffect } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import { selectInitialTableView } from '@tables/workspace/tabs'
import { useTableTabs } from '@tables/workspace/tabsProvider'

export function TablesIndexRoute(): null {
  const navigate = useNavigate()
  const params = useParams({ from: '/conn/$connectionId/tables/' })
  const search = useSearch({ strict: false }) as { empty?: string }
  const { isSchemaReady, tables } = useAvailableTables()
  const { recentViews } = useTableTabs()

  useEffect(() => {
    if (search.empty === 'true' || isSchemaReady === false || tables.length === 0) {
      return
    }

    const initialView = selectInitialTableView(recentViews, tables)
    if (initialView === null) {
      return
    }

    void navigate({
      to: appRoutes.table,
      params: {
        connectionId: params.connectionId,
        tableName: initialView.tableName,
      },
      replace: true,
      search: initialView.search,
    })
  }, [isSchemaReady, navigate, params, recentViews, search.empty, tables])

  return null
}
