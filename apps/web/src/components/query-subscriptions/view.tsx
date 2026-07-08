import { useRef, useState } from "react";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";

import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@regarde/ui/resizablePanel";

import { QuerySubscriptionsGrid } from "@/components/query-subscriptions/dataGrid";
import { QuerySubscriptionsListPane } from "@/components/query-subscriptions/tableListPane";
import { useQuerySubscriptionsState } from "@/components/query-subscriptions/useQuerySubscriptionsState";

export function QuerySubscriptionsScreen(): React.ReactElement {
  const state = useQuerySubscriptionsState();
  const listPaneRef = useRef<PanelImperativeHandle>(null);
  const [isListPaneOpen, setIsListPaneOpen] = useState(true);

  const handleListPaneResize = (panelSize: PanelSize) => {
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
    <ResizableGroup orientation="horizontal" className="min-w-0 bg-background">
      <ResizablePanel
        className="min-w-0 overflow-hidden"
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
      {isListPaneOpen === true ? <ResizableSeparator /> : null}
      <ResizablePanel className="min-w-0 overflow-hidden">
        <QuerySubscriptionsGrid state={state} isListPaneOpen={isListPaneOpen} onToggleListPane={handleToggleListPane} />
      </ResizablePanel>
    </ResizableGroup>
  );
}
