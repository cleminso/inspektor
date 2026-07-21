import { useRef, useState } from "react";

import { SidePanelLayout } from "@/components/layout/sidePanelLayout";
import {
  TableListPane,
  type TableCheckedChangeOptions,
  type TableListSection,
} from "@/components/table-explorer/tableListPane";
import { updateTableNameSelection } from "@/components/table-explorer/tableNameSelection";
import {
  loadPinnedTableNames,
  savePinnedTableNames,
  updatePinnedTableNames,
} from "@/components/table-explorer/tablePins";
import { useTableTabs } from "@/components/table-explorer/tableTabsProvider";
import { TableTabsView } from "@/components/table-explorer/tableTabsView";
import { useInspector } from "@/components/providers/inspectorProvider";
import { useInspectorTables } from "@/hooks/useInspectorTables";

export function TableExplorerScreen(): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash, currentTableName } = useInspector();
  const scope = `${currentConnectionId ?? "none"}:${currentBranch ?? "none"}:${currentSchemaHash ?? "none"}`;

  return (
    <ScopedTableExplorerScreen
      key={scope}
      currentTableName={currentTableName}
      scope={scope}
    />
  );
}

interface ScopedTableExplorerScreenProps {
  currentTableName: string | null;
  scope: string;
}

function ScopedTableExplorerScreen({
  currentTableName,
  scope,
}: ScopedTableExplorerScreenProps): React.ReactElement {
  const [tableSearch, setTableSearch] = useState("");
  const [checkedTableNames, setCheckedTableNames] = useState<ReadonlySet<string>>(() => new Set());
  const [pinnedTableNames, setPinnedTableNames] = useState<ReadonlySet<string>>(() =>
    loadPinnedTableNames(scope),
  );
  const tableSelectionAnchorRef = useRef<string | null>(null);
  const tableSelectionSectionRef = useRef<TableListSection | null>(null);
  const { tables } = useInspectorTables();
  const { openBaseTabs } = useTableTabs();

  const handleTableCheckedChange = (
    tableName: string,
    checked: boolean,
    { extendRange, orderedTableNames, section }: TableCheckedChangeOptions,
  ) => {
    const isSameSection = tableSelectionSectionRef.current === section;
    const currentAnchor = tableSelectionAnchorRef.current;
    const canExtendRange =
      isSameSection === true &&
      extendRange === true &&
      currentAnchor !== null &&
      orderedTableNames.includes(currentAnchor);
    const anchorTableName = canExtendRange === true ? currentAnchor : null;

    if (canExtendRange === false) {
      tableSelectionAnchorRef.current = tableName;
    }
    tableSelectionSectionRef.current = section;

    setCheckedTableNames((currentCheckedTableNames) =>
      updateTableNameSelection({
        anchorTableName,
        checked,
        checkedTableNames: isSameSection === true ? currentCheckedTableNames : new Set(),
        orderedTableNames,
        targetTableName: tableName,
      }),
    );
  };

  const clearTableSelection = () => {
    tableSelectionAnchorRef.current = null;
    tableSelectionSectionRef.current = null;
    setCheckedTableNames(new Set());
  };

  const replaceTableSelection = (tableName: string, section: TableListSection) => {
    tableSelectionAnchorRef.current = tableName;
    tableSelectionSectionRef.current = section;
    setCheckedTableNames(new Set([tableName]));
  };

  const handlePinnedTablesChange = (tableNames: readonly string[], pinned: boolean) => {
    const nextPinnedTableNames = updatePinnedTableNames(
      pinnedTableNames,
      tableNames,
      pinned,
    );
    setPinnedTableNames(nextPinnedTableNames);
    savePinnedTableNames(scope, nextPinnedTableNames);
    clearTableSelection();
  };

  const handleSearchValueChange = (value: string) => {
    clearTableSelection();
    setTableSearch(value);
  };

  const handleOpenTables = (orderedTableNames: readonly string[]) => {
    openBaseTabs(orderedTableNames);
    clearTableSelection();
  };

  return (
    <SidePanelLayout>
      <SidePanelLayout.Panel>
        <TableListPane
          checkedTableNames={checkedTableNames}
          pinnedTableNames={pinnedTableNames}
          searchValue={tableSearch}
          selectedTableName={currentTableName}
          tables={tables}
          onClearSelection={clearTableSelection}
          onOpenTables={handleOpenTables}
          onPinTables={(tableNames) => handlePinnedTablesChange(tableNames, true)}
          onReplaceSelection={replaceTableSelection}
          onSearchValueChange={handleSearchValueChange}
          onTableCheckedChange={handleTableCheckedChange}
          onUnpinTables={(tableNames) => handlePinnedTablesChange(tableNames, false)}
        />
      </SidePanelLayout.Panel>
      <SidePanelLayout.Content>
        <TableTabsView tableName={currentTableName} />
      </SidePanelLayout.Content>
    </SidePanelLayout>
  );
}
