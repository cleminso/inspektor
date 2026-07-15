import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizablePanelRef,
  type ResizablePanelSize,
} from "@inspector/ds";
import { useState } from "react";

import { SelectedTableView } from "@/components/table-explorer/selectedTableView";
import { TableListPane } from "@/components/table-explorer/tableListPane";
import { useInspector } from "@/components/providers/inspectorProvider";
import { useInspectorTables } from "@/hooks/useInspectorTables";

export function TableExplorerScreen(): React.ReactElement {
  const { currentTableName } = useInspector();
  const [tableSearch, setTableSearch] = useState("");
  const { tables } = useInspectorTables();
  const listPaneRef = useResizablePanelRef();
  const [isListPaneOpen, setIsListPaneOpen] = useState(true);

  const handleListPaneResize = (panelSize: ResizablePanelSize) => {
    const nextIsListPaneOpen = panelSize.inPixels > 0;
    setIsListPaneOpen((currentIsListPaneOpen) =>
      currentIsListPaneOpen === nextIsListPaneOpen ? currentIsListPaneOpen : nextIsListPaneOpen,
    );
  };

  const handleToggleListPane = () => {
    const panel = listPaneRef.current;
    if (panel === null) {
      return;
    }
    if (panel.isCollapsed() === true) {
      panel.expand();
      setIsListPaneOpen(true);
    } else {
      panel.collapse();
      setIsListPaneOpen(false);
    }
  };

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel
        panelRef={listPaneRef}
        collapsible
        collapsedSize={0}
        defaultSize={200}
        minSize={160}
        maxSize={360}
        onResize={handleListPaneResize}
      >
        <TableListPane
          searchValue={tableSearch}
          selectedTableName={currentTableName}
          tables={tables}
          onSearchValueChange={setTableSearch}
        />
      </ResizablePanel>
      {isListPaneOpen === true ? <ResizableHandle /> : null}
      <ResizablePanel>
        <SelectedTableView
          isListPaneOpen={isListPaneOpen}
          tableName={currentTableName}
          onToggleListPane={handleToggleListPane}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
