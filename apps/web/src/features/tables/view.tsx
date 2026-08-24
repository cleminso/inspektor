import { useMemo, useRef, useState } from 'react'
import { useSearch } from '@tanstack/react-router'

import { useInspectorSessionState } from '@app/providers/inspectorProvider'
import {
  TableListPane,
  type TableCheckedChangeOptions,
  type TableListSection,
} from '@tables/tableList/pane'
import { SidePanelLayout } from '@tables/tableList/layout'
import { updateTableNameSelection } from '@tables/tableList/selection'
import {
  loadPinnedTableNames,
  savePinnedTableNames,
  updatePinnedTableNames,
} from '@tables/tableList/pins'
import { useTableTabs } from '@tables/workspace/tabsProvider'
import { useAvailableTables } from '@tables/schema/useAvailableTables'
import { TableTabsView } from '@tables/workspace/tabsView'

export function TableExplorerScreen(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash, currentTableName } =
    useInspectorSessionState()
  const routeSearch = useSearch({ strict: false })
  const currentView = routeSearch.view === 'schema' ? 'schema' : 'data'
  const scope = `${currentConnectionId ?? 'none'}:${currentBranch ?? 'none'}:${currentSchemaHash ?? 'none'}`
  const [checkedTableNames, setCheckedTableNames] = useState<ReadonlySet<string>>(() => new Set())
  const [pinnedTableNames, setPinnedTableNames] = useState<ReadonlySet<string>>(() =>
    loadPinnedTableNames(scope),
  )
  const tableSelectionAnchorRef = useRef<string | null>(null)
  const tableSelectionSectionRef = useRef<TableListSection | null>(null)
  const { isSchemaReady, tables } = useAvailableTables()
  const { openBaseTabs, persistTable, tabs: openTabs } = useTableTabs()
  const tableSearchByName = useMemo(
    () =>
      new Map(
        openTabs.flatMap((tab) =>
          tab.kind === 'table' && tab.search.view !== 'schema'
            ? [[tab.tableName, tab.search] as const]
            : [],
        ),
      ),
    [openTabs],
  )

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
    <SidePanelLayout>
      <SidePanelLayout.Panel>
        <TableListPane
          checkedTableNames={checkedTableNames}
          isSchemaReady={isSchemaReady}
          pinnedTableNames={pinnedTableNames}
          selectedTableName={currentTableName}
          tableSearchByName={tableSearchByName}
          tables={tables}
          onClearSelection={clearTableSelection}
          onOpenTables={handleOpenTables}
          onPersistTable={persistTable}
          onPinTables={(tableNames) => handlePinnedTablesChange(tableNames, true)}
          onReplaceSelection={replaceTableSelection}
          onTableCheckedChange={handleTableCheckedChange}
          onUnpinTables={(tableNames) => handlePinnedTablesChange(tableNames, false)}
        />
      </SidePanelLayout.Panel>
      <SidePanelLayout.Content>
        <TableTabsView
          tableName={currentTableName}
          view={currentView}
        />
      </SidePanelLayout.Content>
    </SidePanelLayout>
  )
}
