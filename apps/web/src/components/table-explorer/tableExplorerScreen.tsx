import { useRef, useState } from "react";

import { SidePanelLayout } from "@/components/layout/sidePanelLayout";
import { SelectedTableView } from "@/components/table-explorer/selectedTableView";
import {
  TableListPane,
  type TableCheckedChangeOptions,
} from "@/components/table-explorer/tableListPane";
import { updateTableNameSelection } from "@/components/table-explorer/tableNameSelection";
import { useInspector } from "@/components/providers/inspectorProvider";
import { useInspectorTables } from "@/hooks/useInspectorTables";

export function TableExplorerScreen(): React.ReactElement {
  const { currentTableName } = useInspector();
  const [tableSearch, setTableSearch] = useState("");
  const [checkedTableNames, setCheckedTableNames] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const tableSelectionAnchorRef = useRef<string | null>(null);
  const { tables } = useInspectorTables();

  const handleTableCheckedChange = (
    tableName: string,
    checked: boolean,
    { extendRange, orderedTableNames }: TableCheckedChangeOptions,
  ) => {
    const currentAnchor = tableSelectionAnchorRef.current;
    const canExtendRange =
      extendRange === true &&
      currentAnchor !== null &&
      orderedTableNames.includes(currentAnchor);
    const anchorTableName = canExtendRange === true ? currentAnchor : null;

    if (canExtendRange === false) {
      tableSelectionAnchorRef.current = tableName;
    }

    setCheckedTableNames((currentCheckedTableNames) =>
      updateTableNameSelection({
        anchorTableName,
        checked,
        checkedTableNames: currentCheckedTableNames,
        orderedTableNames,
        targetTableName: tableName,
      }),
    );
  };

  const clearTableSelection = () => {
    tableSelectionAnchorRef.current = null;
    setCheckedTableNames(new Set());
  };

  return (
    <SidePanelLayout>
      <SidePanelLayout.Panel>
        <TableListPane
          checkedTableNames={checkedTableNames}
          searchValue={tableSearch}
          selectedTableName={currentTableName}
          tables={tables}
          onClearSelection={clearTableSelection}
          onSearchValueChange={setTableSearch}
          onTableCheckedChange={handleTableCheckedChange}
        />
      </SidePanelLayout.Panel>
      <SidePanelLayout.Content>
        <SelectedTableView tableName={currentTableName} />
      </SidePanelLayout.Content>
    </SidePanelLayout>
  );
}
