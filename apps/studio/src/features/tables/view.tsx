import { useEffect, useMemo, useRef, useState } from 'react'
import { ShellLayout } from '@inspektor/ds'
import { useSearch } from '@tanstack/react-router'

import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import {
  TableListPane,
  type TableCheckedChangeOptions,
  type TableListSection,
} from '@tables/tableList/pane'
import { updateTableNameSelection } from '@tables/tableList/selection'
import {
  loadPinnedTableNames,
  savePinnedTableNames,
  updatePinnedTableNames,
} from '@tables/tableList/pins'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import { TableTabsView } from '@tables/workspace/tabsView'
import { createTableSearchByName } from '@tables/workspace/tabs'

export function TableExplorerScreen(): React.ReactElement {
  const { currentTableName } = useInspectorSessionState()
  // Unrelated URL state must not rerender the complete table explorer.
  const routeSearch = useSearch({
    strict: false,
    select: (search) => ({ empty: search.empty, view: search.view }),
  })
  const currentView = routeSearch.view === 'schema' ? 'schema' : 'data'
  const {
    openBaseTabs,
    openTable,
    pendingTableName,
    persistTable,
    scope,
    tabs: openTabs,
  } = useTableTabs()
  const [checkedTableNames, setCheckedTableNames] = useState<ReadonlySet<string>>(() => new Set())
  const [pinnedTableNames, setPinnedTableNames] = useState<ReadonlySet<string>>(() =>
    loadPinnedTableNames(scope),
  )
  const tableSelectionAnchorRef = useRef<string | null>(null)
  const tableSelectionSectionRef = useRef<TableListSection | null>(null)
  const { isSchemaReady, tables } = useAvailableTables()
  useEffect(() => {
    const availableTableNames = new Set(tables)
    if (
      tableSelectionAnchorRef.current !== null &&
      availableTableNames.has(tableSelectionAnchorRef.current) === false
    ) {
      tableSelectionAnchorRef.current = null
    }
    setCheckedTableNames((currentCheckedTableNames) => {
      const nextCheckedTableNames = new Set(
        [...currentCheckedTableNames].filter((tableName) => availableTableNames.has(tableName)),
      )
      return nextCheckedTableNames.size === currentCheckedTableNames.size
        ? currentCheckedTableNames
        : nextCheckedTableNames
    })
  }, [tables])
  const connectionEntryPending =
    isSchemaReady === false ||
    (currentTableName === null && routeSearch.empty !== 'true' && tables.length > 0)
  const tableSearchByName = useMemo(() => createTableSearchByName(openTabs), [openTabs])

  const handleTableCheckedChange = (
    tableName: string,
    checked: boolean,
    { extendRange, orderedTableNames, section }: TableCheckedChangeOptions,
  ) => {
    const isSameSection = tableSelectionSectionRef.current === section
    const currentAnchor = tableSelectionAnchorRef.current
    const canExtendRange =
      isSameSection === true &&
      extendRange === true &&
      currentAnchor !== null &&
      orderedTableNames.includes(currentAnchor)
    const anchorTableName = canExtendRange === true ? currentAnchor : null

    if (canExtendRange === false) {
      tableSelectionAnchorRef.current = tableName
    }
    tableSelectionSectionRef.current = section

    setCheckedTableNames((currentCheckedTableNames) =>
      updateTableNameSelection({
        anchorTableName,
        checked,
        checkedTableNames: isSameSection === true ? currentCheckedTableNames : new Set(),
        orderedTableNames,
        targetTableName: tableName,
      }),
    )
  }

  const clearTableSelection = () => {
    tableSelectionAnchorRef.current = null
    tableSelectionSectionRef.current = null
    setCheckedTableNames(new Set())
  }

  const replaceTableSelection = (tableName: string, section: TableListSection) => {
    tableSelectionAnchorRef.current = tableName
    tableSelectionSectionRef.current = section
    setCheckedTableNames(new Set([tableName]))
  }

  const handlePinnedTablesChange = (tableNames: readonly string[], pinned: boolean) => {
    const nextPinnedTableNames = updatePinnedTableNames(pinnedTableNames, tableNames, pinned)
    setPinnedTableNames(nextPinnedTableNames)
    savePinnedTableNames(scope, nextPinnedTableNames)
    clearTableSelection()
  }

  const handleOpenTables = (orderedTableNames: readonly string[]) => {
    openBaseTabs(orderedTableNames)
    clearTableSelection()
  }

  return (
    <ShellLayout.Body>
      <ShellLayout.LeftDock>
        <TableListPane
          checkedTableNames={checkedTableNames}
          isSchemaReady={isSchemaReady}
          pinnedTableNames={pinnedTableNames}
          pendingTableName={pendingTableName}
          selectedTableName={currentTableName}
          tableSearchByName={tableSearchByName}
          tables={tables}
          onClearSelection={clearTableSelection}
          onOpenTables={handleOpenTables}
          onOpenTable={openTable}
          onPersistTable={persistTable}
          onPinTables={(tableNames) => handlePinnedTablesChange(tableNames, true)}
          onReplaceSelection={replaceTableSelection}
          onTableCheckedChange={handleTableCheckedChange}
          onUnpinTables={(tableNames) => handlePinnedTablesChange(tableNames, false)}
        />
      </ShellLayout.LeftDock>
      <ShellLayout.View>
        <TableTabsView
          connectionEntryPending={connectionEntryPending}
          tableName={currentTableName}
          view={currentView}
        />
      </ShellLayout.View>
    </ShellLayout.Body>
  )
}
