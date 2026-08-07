import { Box, Button, Icon, TabView, Tooltip } from '@inspector/ds'
import { Layers3, Plus, Table2 } from 'lucide-react'
import { useRef } from 'react'

import { useRuntimeClient, useRuntimeSchema } from '@app/providers/inspectorProvider'
import {
  type TableRowsPrefetchTarget,
  useTableRowsPrefetchIntent,
} from '@tables/query/useTableRowsPrefetchIntent'
import { resolveTableRowsSearch } from '@tables/routing/tableRowsSearch'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { NewTableView } from '@tables/workspace/newView'
import { SelectedTableView } from '@tables/workspace/selectedView'
import { NEW_VIEW_TAB_ID, createBaseTableTabId, type TableDataTab } from '@tables/workspace/tabs'

interface TableTabsViewProps {
  tableName: string | null
}

export function TableTabsView({ tableName }: TableTabsViewProps): React.ReactElement {
  const { activeTabId, activateTab, closeTab, openNewView, reorderTabs, tabs } = useTableTabs()
  const client = useRuntimeClient()
  const wasmSchema = useRuntimeSchema()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const pointerIntentTabIdRef = useRef<string | null>(null)
  const focusedIntentTabIdRef = useRef<string | null>(null)
  const prefetchIntent = useTableRowsPrefetchIntent({
    activeKey: activeTabId,
    availableKeys: tabs.flatMap((tab) => (tab.kind === 'table' ? [tab.id] : [])),
    client,
    schema: wasmSchema,
  })

  const getPrefetchTarget = (tabId: string): TableRowsPrefetchTarget | null => {
    const tab = tabs.find(
      (candidate): candidate is TableDataTab =>
        candidate.kind === 'table' && candidate.id === tabId,
    )
    if (
      tab === undefined ||
      tab.id === activeTabId ||
      tab.search.view === 'schema' ||
      wasmSchema === null ||
      Object.hasOwn(wasmSchema, tab.tableName) === false
    ) {
      return null
    }

    const search = resolveTableRowsSearch(tab.search)
    return {
      key: tab.id,
      filters: search.filters,
      page: search.page,
      pageSize: search.pageSize,
      sortColumn: search.sortColumn,
      sortDirection: search.sortDirection,
      tableName: tab.tableName,
    }
  }

  const prefetchTabRows = (tabId: string) => {
    const target = getPrefetchTarget(tabId)
    if (target !== null) {
      prefetchIntent.prefetch(target)
    }
  }

  const scheduleTabRowsPrefetch = (tabId: string) => {
    const target = getPrefetchTarget(tabId)
    if (target !== null) {
      prefetchIntent.schedule(target)
    }
  }

  return (
    <TabView.Root
      value={activeTabId}
      onValueChange={(value) => {
        if (value !== null) {
          const tabId = String(value)
          prefetchTabRows(tabId)
          activateTab(tabId)
        }
      }}
    >
      <Box
        width="full"
        flexShrink={0}
        alignItems="center"
        gap="s"
        padding="xs"
        backgroundColor="bg-page"
        borderBottomWidth={1}
        borderColor="border-secondary"
        borderStyle="solid"
        overflow="hidden"
      >
        <Box
          minWidth={0}
          flex={1}
          alignItems="center"
          gap="xs"
          overflow="hidden"
        >
          <TabView.List
            aria-label="Open table views"
            values={tabs.map((tab) => tab.id)}
            onReorder={(orderedTabIds) => {
              reorderTabs(
                orderedTabIds.filter((tabId): tabId is string => typeof tabId === 'string'),
              )
            }}
          >
            {tabs.map((tab) => {
              if (tab.kind === 'newView') {
                const canCloseNewView = tabs.length > 1
                return (
                  <TabView.Item
                    key={tab.id}
                    value={tab.id}
                    closeLabel="Close New view"
                    onClose={
                      canCloseNewView === true
                        ? () => {
                            closeTab(tab.id)
                          }
                        : undefined
                    }
                  >
                    New view
                  </TabView.Item>
                )
              }

              const isBaseTab = tab.id === createBaseTableTabId(tab.tableName)
              return (
                <TabView.Item
                  key={tab.id}
                  value={tab.id}
                  prefix={
                    isBaseTab === true ? (
                      <Icon
                        render={<Table2 />}
                        size="s"
                      />
                    ) : (
                      <Icon
                        render={<Layers3 />}
                        size="s"
                      />
                    )
                  }
                  details={isBaseTab === false ? `Filtered view of ${tab.tableName}` : undefined}
                  closeLabel={`Close ${tab.tableName}`}
                  onBlur={() => {
                    if (focusedIntentTabIdRef.current === tab.id) {
                      focusedIntentTabIdRef.current = null
                    }
                    if (pointerIntentTabIdRef.current !== tab.id) {
                      prefetchIntent.release(tab.id)
                    }
                  }}
                  onClose={() => {
                    prefetchIntent.cancelScheduled()
                    prefetchIntent.release(tab.id)
                    closeTab(tab.id)
                  }}
                  onFocus={() => {
                    focusedIntentTabIdRef.current = tab.id
                    prefetchTabRows(tab.id)
                  }}
                  onPointerDown={() => {
                    pointerIntentTabIdRef.current = tab.id
                    prefetchTabRows(tab.id)
                  }}
                  onPointerEnter={() => {
                    pointerIntentTabIdRef.current = tab.id
                    scheduleTabRowsPrefetch(tab.id)
                  }}
                  onPointerLeave={() => {
                    if (pointerIntentTabIdRef.current === tab.id) {
                      pointerIntentTabIdRef.current = null
                    }
                    prefetchIntent.cancelScheduled()
                    if (focusedIntentTabIdRef.current !== tab.id) {
                      prefetchIntent.release(tab.id)
                    }
                  }}
                >
                  {tab.tableName}
                </TabView.Item>
              )
            })}
          </TabView.List>
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  aria-label="Open new table view"
                  iconOnly
                  onClick={openNewView}
                >
                  <Icon
                    render={<Plus />}
                    size="s"
                  />
                </Button>
              }
            />
            <Tooltip.Content>Open new table view</Tooltip.Content>
          </Tooltip.Root>
        </Box>
      </Box>
      {activeTab?.kind === 'table' && tableName !== null ? (
        <TabView.Panel value={activeTab.id}>
          <SelectedTableView tableName={tableName} />
        </TabView.Panel>
      ) : activeTab?.kind === 'newView' ? (
        <TabView.Panel value={NEW_VIEW_TAB_ID}>
          <NewTableView />
        </TabView.Panel>
      ) : (
        <Box
          minHeight={0}
          flex={1}
        >
          <NewTableView />
        </Box>
      )}
    </TabView.Root>
  )
}
