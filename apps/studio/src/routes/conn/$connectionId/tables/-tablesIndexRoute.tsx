// The `-` prefix keeps this support module out of TanStack Router's generated route tree.
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'

import { appRoutes } from '@app/routing/appRoutes'
import { resolveTableRowsSearch } from '@tables/routing/tableRowsSearch'
import { useTableNavigationPreparation } from '@tables/routing/tableNavigationPreparation'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import { selectInitialTableView } from '@tables/workspace/tabs'
import { useTableTabs } from '@tables/workspace/tabsProvider'

export function TablesIndexRoute(): null {
  const navigate = useNavigate()
  const params = useParams({ from: '/conn/$connectionId/tables/' })
  const search = useSearch({ strict: false }) as { empty?: string }
  const { isSchemaReady, tables } = useAvailableTables()
  const { recentViews } = useTableTabs()
  const { cancel, prepare } = useTableNavigationPreparation()
  const initialView = useMemo(
    () => selectInitialTableView(recentViews, tables),
    [recentViews, tables],
  )

  useEffect(() => {
    if (search.empty === 'true' || isSchemaReady === false) {
      return
    }

    if (tables.length === 0) {
      void navigate({
        to: appRoutes.tables,
        params: { connectionId: params.connectionId },
        replace: true,
        search: { empty: 'true' },
      })
      return
    }

    if (initialView === null) {
      return
    }

    const commit = () =>
      navigate({
        to: appRoutes.table,
        params: {
          connectionId: params.connectionId,
          tableName: initialView.tableName,
        },
        replace: true,
        search: initialView.search,
      })
    if (initialView.search.view === 'schema') {
      cancel()
      void commit()
      return
    }

    void prepare(
      {
        policy: 'replace',
        search: resolveTableRowsSearch(initialView.search),
        tableName: initialView.tableName,
      },
      commit,
    ).catch(() => undefined)
  }, [cancel, initialView, isSchemaReady, navigate, params, prepare, search.empty, tables])

  return null
}
