import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizablePanelRef,
  type ResizablePanelSize,
} from "@inspector/ds";
import { useState } from "react";

import { QuerySubscriptionsGrid } from "@/components/query-subscriptions/dataGrid";
import { QuerySubscriptionsListPane } from "@/components/query-subscriptions/tableListPane";
import { useQuerySubscriptionsState } from "@/components/query-subscriptions/useQuerySubscriptionsState";

export function QuerySubscriptionsScreen(): React.ReactElement {
  const state = useQuerySubscriptionsState();
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
        <QuerySubscriptionsListPane
          isInitialLoading={state.isInitialLoading}
          searchValue={state.listSearchValue}
          selectedTableName={state.selectedTableName}
          visibleTableItems={state.visibleTableItems}
          onSearchValueChange={state.setListSearchValue}
          onSelectedTableNameChange={state.setSelectedTableName}
        />
      </ResizablePanel>
      {isListPaneOpen === true ? <ResizableHandle /> : null}
      <ResizablePanel>
        <QuerySubscriptionsGrid state={state} isListPaneOpen={isListPaneOpen} onToggleListPane={handleToggleListPane} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
