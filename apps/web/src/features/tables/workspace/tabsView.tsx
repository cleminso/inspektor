import {
  Box,
  Button,
  Icon,
  WorkspaceTabs,
  Tooltip,
} from '@inspector/ds'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { useRef } from 'react'

import { useRuntimeClient, useRuntimeSchema } from '@app/providers/inspectorProvider'
import { productGlyphs } from '@app/icons/productGlyphs'
import {
  type TableRowsPrefetchTarget,
  useTableRowsPrefetchIntent,
} from '@tables/query/useTableRowsPrefetchIntent'
import { resolveTableRowsSearch } from '@tables/routing/tableRowsSearch'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { NewTableView } from '@tables/workspace/newView'
import { SelectedTableView } from '@tables/workspace/selectedView'
import { NEW_VIEW_TAB_ID, createBaseTableTabId, type TableDataTab } from '@tables/workspace/tabs'
import { useTableNavigationControls } from '@tables/workspace/navigationHistory'

interface TableTabsViewProps {
  tableName: string | null
}

export function TableTabsView({ tableName }: TableTabsViewProps): React.ReactElement {
  const { activeTabId, activateTab, closeTab, openNewView, reorderTabs, tabs } = useTableTabs()
  const { canGoBack, canGoForward, goBack, goForward } = useTableNavigationControls()
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
    <WorkspaceTabs.Root
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
        backgroundColor="surface-background"
        borderBottomWidth={1}
        borderColor="subtle"
        borderStyle="solid"
        overflow="hidden"
      >
        <WorkspaceTabs.Bar>
          <WorkspaceTabs.LeadingArea aria-label="Table navigation">
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="s"
                    radius="xs"
                    aria-label="Go Back"
                    disabled={canGoBack === false}
                    focusableWhenDisabled
                    iconOnly
                    onClick={goBack}
                  >
                    <Button.Glyph artwork={ArrowLeft} />
                  </Button>
                }
              />
              <Tooltip.Content>Go Back</Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="s"
                    radius="xs"
                    aria-label="Go Forward"
                    disabled={canGoForward === false}
                    focusableWhenDisabled
                    iconOnly
                    onClick={goForward}
                  >
                    <Button.Glyph artwork={ArrowRight} />
                  </Button>
                }
              />
              <Tooltip.Content>Go Forward</Tooltip.Content>
            </Tooltip.Root>
          </WorkspaceTabs.LeadingArea>
          <WorkspaceTabs.List
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
                  <WorkspaceTabs.Tab
                    key={tab.id}
                    value={tab.id}
                    closeLabel="Close New view"
                    reorderLabel="Reorder New view"
                    onClose={
                      canCloseNewView === true
                        ? () => {
                            closeTab(tab.id)
                          }
                        : undefined
                    }
                  >
                    New view
                  </WorkspaceTabs.Tab>
                )
              }

              const isBaseTab = tab.id === createBaseTableTabId(tab.tableName)
              const tabLabel =
                isBaseTab === true
                  ? tab.tableName
                  : tab.search.view === 'schema'
                    ? `${tab.tableName} schema`
                    : `${tab.tableName} filtered view`
              return (
                <WorkspaceTabs.Tab
                  key={tab.id}
                  value={tab.id}
                  prefix={
                    isBaseTab === true ? (
                      <Icon artwork={productGlyphs.table} size="s" />
                    ) : (
                      <Icon artwork={productGlyphs.derivedView} size="s" />
                    )
                  }
                  closeLabel={`Close ${tabLabel}`}
                  reorderLabel={`Reorder ${tabLabel}`}
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
                  {tabLabel}
                </WorkspaceTabs.Tab>
              )
            })}
          </WorkspaceTabs.List>
          <WorkspaceTabs.TrailingArea aria-label="Table view actions">
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="s"
                    radius="xs"
                    aria-label="Open new table view"
                    iconOnly
                    onClick={openNewView}
                  >
                    <Button.Glyph artwork={Plus} />
                  </Button>
                }
              />
              <Tooltip.Content>Open new table view</Tooltip.Content>
            </Tooltip.Root>
          </WorkspaceTabs.TrailingArea>
        </WorkspaceTabs.Bar>
      </Box>
      {activeTab?.kind === 'table' && tableName !== null ? (
        <WorkspaceTabs.Panel value={activeTab.id}>
          <SelectedTableView tableName={tableName} />
        </WorkspaceTabs.Panel>
      ) : activeTab?.kind === 'newView' ? (
        <WorkspaceTabs.Panel value={NEW_VIEW_TAB_ID}>
          <NewTableView />
        </WorkspaceTabs.Panel>
      ) : (
        <Box
          minHeight={0}
          flex={1}
        >
          <NewTableView />
        </Box>
      )}
    </WorkspaceTabs.Root>
  )
}
