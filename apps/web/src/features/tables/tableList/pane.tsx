import {
  Accordion,
  ActionList,
  Box,
  ContextMenu,
  Icon,
  Menu,
  SidePanel,
  Text,
  Tooltip,
} from '@inspector/ds'
import { Link } from '@tanstack/react-router'
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react'

import { productGlyphs } from '@app/icons/productGlyphs'
import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import { appRoutes } from '@app/routing/appRoutes'
import type { TableTabSearch } from '@tables/workspace/tabs'

const deferredRenderingThreshold = 50
const emptyTableSearchByName: ReadonlyMap<string, TableTabSearch> = new Map()
const tableNameResizeSubscriptions = new Map<Element, () => void>()
let tableNameResizeObserver: ResizeObserver | null = null
let tableNameObservedFontSet: FontFaceSet | null = null

function updateTableNameMeasurements(): void {
  for (const updateMeasurement of tableNameResizeSubscriptions.values()) {
    updateMeasurement()
  }
}

function observeTableNameResize(element: Element, callback: () => void): () => void {
  tableNameResizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      tableNameResizeSubscriptions.get(entry.target)?.()
    }
  })
  tableNameResizeSubscriptions.set(element, callback)
  tableNameResizeObserver.observe(element)
  if (tableNameResizeSubscriptions.size === 1) {
    tableNameObservedFontSet = document.fonts
    tableNameObservedFontSet?.addEventListener('loadingdone', updateTableNameMeasurements)
  }

  return () => {
    tableNameResizeSubscriptions.delete(element)
    tableNameResizeObserver?.unobserve(element)
    if (tableNameResizeSubscriptions.size === 0) {
      tableNameResizeObserver?.disconnect()
      tableNameResizeObserver = null
      tableNameObservedFontSet?.removeEventListener('loadingdone', updateTableNameMeasurements)
      tableNameObservedFontSet = null
    }
  }
}

function TableNameTooltip({
  renderTrigger,
  tableName,
}: {
  renderTrigger: (label: ReactElement) => ReactElement
  tableName: string
}): ReactElement {
  const [truncated, setTruncated] = useState(false)
  const tableNameRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const tableNameElement = tableNameRef.current
    if (tableNameElement === null) {
      return
    }

    const updateTruncation = () => {
      setTruncated(tableNameElement.scrollWidth > tableNameElement.clientWidth)
    }
    updateTruncation()
    return observeTableNameResize(tableNameElement, updateTruncation)
  }, [tableName])
  const trigger = renderTrigger(
    <Text
      ref={tableNameRef}
      as="span"
      color="inherit"
      truncate
      data-slot="table-name"
    >
      {tableName}
    </Text>,
  )

  return (
    <Tooltip.Root disabled={truncated === false}>
      <Tooltip.Trigger render={trigger} />
      <Tooltip.Content side="top">{tableName}</Tooltip.Content>
    </Tooltip.Root>
  )
}

export type TableListSection = 'pinned' | 'tables'

export interface TableCheckedChangeOptions {
  extendRange: boolean
  orderedTableNames: readonly string[]
  section: TableListSection
}

interface TableListPaneProps {
  checkedTableNames: ReadonlySet<string>
  isSchemaReady?: boolean
  pinnedTableNames: ReadonlySet<string>
  selectedTableName: string | null
  tableSearchByName?: ReadonlyMap<string, TableTabSearch>
  tables: string[]
  onClearSelection: () => void
  onOpenTables: (orderedTableNames: readonly string[]) => void
  onPersistTable: (tableName: string) => void
  onPinTables: (tableNames: readonly string[]) => void
  onReplaceSelection: (tableName: string, section: TableListSection) => void
  onTableCheckedChange: (
    tableName: string,
    checked: boolean,
    options: TableCheckedChangeOptions,
  ) => void
  onUnpinTables: (tableNames: readonly string[]) => void
}

function getActionLabel(action: 'Open' | 'Pin' | 'Unpin', count: number): string {
  return `${action} ${count} ${count === 1 ? 'table' : 'tables'}`
}

function isTableSelectionInteraction(target: EventTarget | null): boolean {
  if (target instanceof Element === false) {
    return false
  }

  if (target.closest('[data-slot="context-menu-popup"], [data-slot="menu-popup"]') !== null) {
    return true
  }

  const actionList = target.closest('[data-slot="action-list"]')
  const label = actionList?.getAttribute('aria-label')
  return label === 'Pinned tables' || label === 'Tables'
}

export function TableListPane({
  checkedTableNames,
  isSchemaReady = true,
  pinnedTableNames,
  selectedTableName,
  tableSearchByName = emptyTableSearchByName,
  tables,
  onClearSelection,
  onOpenTables,
  onPersistTable,
  onPinTables,
  onReplaceSelection,
  onTableCheckedChange,
  onUnpinTables,
}: TableListPaneProps): React.ReactElement {
  const { currentConnectionId } = useInspectorSessionState()
  const pinnedTables = tables.filter((tableName) => pinnedTableNames.has(tableName))
  const unpinnedTables = tables.filter((tableName) => pinnedTableNames.has(tableName) === false)
  const deferTableRendering = tables.length > deferredRenderingThreshold
  const hasCheckedTables = checkedTableNames.size > 0
  const clearSelection = useEffectEvent(onClearSelection)
  const pendingMenuActionRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (hasCheckedTables === false) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isTableSelectionInteraction(event.target) === false) {
        clearSelection()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [hasCheckedTables])

  const renderTableList = (
    section: TableListSection,
    sectionTables: readonly string[],
  ): React.ReactElement => {
    const orderedCheckedTableNames = sectionTables.filter((tableName) =>
      checkedTableNames.has(tableName),
    )
    const handleActionsOpenChangeComplete = (open: boolean) => {
      if (open === true) {
        return
      }

      const pendingMenuAction = pendingMenuActionRef.current
      pendingMenuActionRef.current = null
      pendingMenuAction?.()
    }
    const togglePinnedTables = () => {
      if (section === 'pinned') {
        onUnpinTables(orderedCheckedTableNames)
      } else {
        onPinTables(orderedCheckedTableNames)
      }
    }
    const scheduleClearSelection = () => {
      pendingMenuActionRef.current = onClearSelection
    }
    return (
      <ContextMenu.Root onOpenChangeComplete={handleActionsOpenChangeComplete}>
        <ContextMenu.Trigger
          onContextMenu={(event) => {
            if (event.target instanceof Element === false) {
              return
            }
            const tableName =
              event.target.closest<HTMLElement>('[data-table-name]')?.dataset.tableName
            if (tableName !== undefined && checkedTableNames.has(tableName) === false) {
              onReplaceSelection(tableName, section)
            }
          }}
          render={
            <ActionList
              aria-label={section === 'pinned' ? 'Pinned tables' : 'Tables'}
              onEscapeKeyDown={(event) => {
                if (hasCheckedTables === false) {
                  return
                }

                onClearSelection()
                event.preventDefault()
              }}
            />
          }
        >
          {sectionTables.map((tableName) => {
            const isActive = selectedTableName === tableName
            const isChecked = checkedTableNames.has(tableName)
            const tableParams =
              currentConnectionId !== null
                ? {
                    connectionId: currentConnectionId,
                    tableName,
                  }
                : null
            const handleActionsOpenChange = (open: boolean) => {
              if (open === true && isChecked === false) {
                onReplaceSelection(tableName, section)
              }
            }
            const changeChecked = (checked: boolean, event: Event) => {
              onTableCheckedChange(tableName, checked, {
                extendRange: 'shiftKey' in event && event.shiftKey === true,
                orderedTableNames: sectionTables,
                section,
              })
            }
            const renderTrigger = (label: ReactElement): ReactElement =>
              tableParams === null ? (
                <ActionList.Trigger disabled>{label}</ActionList.Trigger>
              ) : hasCheckedTables === true ? (
                <ActionList.Trigger
                  onClick={(event) => {
                    changeChecked(isChecked === false, event.nativeEvent)
                  }}
                >
                  {label}
                </ActionList.Trigger>
              ) : (
                <ActionList.Trigger
                  nativeButton={false}
                  render={
                    <Link
                      to={appRoutes.table}
                      params={tableParams}
                      search={tableSearchByName.get(tableName) ?? {}}
                      aria-current={isActive === true ? 'page' : undefined}
                      onDoubleClick={() => {
                        onPersistTable(tableName)
                      }}
                    />
                  }
                >
                  {label}
                </ActionList.Trigger>
              )

            return (
              <ActionList.Item
                key={tableName}
                active={isActive}
                checked={isChecked}
                data-table-name={tableName}
                deferOffscreenRendering={deferTableRendering}
              >
                <ActionList.SelectionControl
                  aria-label={`Select ${tableName}`}
                  checked={isChecked}
                  icon={
                    <Icon
                      artwork={productGlyphs.table}
                      size="s"
                    />
                  }
                  onCheckedChange={(checked, eventDetails) => {
                    changeChecked(checked === true, eventDetails.event)
                  }}
                />
                <TableNameTooltip
                  renderTrigger={renderTrigger}
                  tableName={tableName}
                />
                <Menu.Root
                  onOpenChange={handleActionsOpenChange}
                  onOpenChangeComplete={handleActionsOpenChangeComplete}
                >
                  <Menu.Trigger
                    render={<ActionList.Action aria-label={`Open ${tableName} actions`} />}
                  >
                    <Icon
                      artwork={productGlyphs.ellipsis}
                      size="s"
                    />
                  </Menu.Trigger>
                  <Menu.Content align="end">
                    <Menu.Item onClick={() => onOpenTables(orderedCheckedTableNames)}>
                      {getActionLabel('Open', orderedCheckedTableNames.length)}
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item
                      onClick={() => {
                        togglePinnedTables()
                      }}
                    >
                      {getActionLabel(
                        section === 'pinned' ? 'Unpin' : 'Pin',
                        orderedCheckedTableNames.length,
                      )}
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item
                      variant="danger"
                      onClick={() => {
                        scheduleClearSelection()
                      }}
                    >
                      Deselect all
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Root>
              </ActionList.Item>
            )
          })}
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onClick={() => onOpenTables(orderedCheckedTableNames)}>
            {getActionLabel('Open', orderedCheckedTableNames.length)}
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item onClick={togglePinnedTables}>
            {getActionLabel(
              section === 'pinned' ? 'Unpin' : 'Pin',
              orderedCheckedTableNames.length,
            )}
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item
            variant="danger"
            onClick={scheduleClearSelection}
          >
            Deselect all
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    )
  }

  return (
    <SidePanel>
      <SidePanel.Body>
        <Accordion
          defaultValue={['pinned', 'tables']}
          layout="fill"
          multiple
        >
          {pinnedTables.length > 0 ? (
            <Accordion.Item value="pinned">
              <Accordion.Header level={2}>
                <Accordion.Trigger
                  suffix={
                    <Text
                      as="span"
                      variant="caption"
                      color="muted"
                      tabularNums
                    >
                      {pinnedTables.length}
                    </Text>
                  }
                >
                  PINNED
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>
                <Box
                  paddingTop="xxs"
                  flexDirection="column"
                >
                  {renderTableList('pinned', pinnedTables)}
                </Box>
              </Accordion.Panel>
            </Accordion.Item>
          ) : null}
          <Accordion.Item value="tables">
            <Accordion.Header level={2}>
              <Accordion.Trigger
                suffix={
                  isSchemaReady === true ? (
                    <Text
                      as="span"
                      variant="caption"
                      color="muted"
                      tabularNums
                    >
                      {unpinnedTables.length}
                    </Text>
                  ) : null
                }
              >
                TABLES
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <Box
                paddingTop="xxs"
                flexDirection="column"
              >
                {isSchemaReady === false ? null : tables.length === 0 ? (
                  <Box
                    padding="m"
                    flexDirection="column"
                    gap="xs"
                  >
                    <Text variant="label">No tables</Text>
                    <Text
                      variant="caption"
                      color="muted"
                    >
                      No published tables found in this schema.
                    </Text>
                  </Box>
                ) : (
                  renderTableList('tables', unpinnedTables)
                )}
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </SidePanel.Body>
    </SidePanel>
  )
}
