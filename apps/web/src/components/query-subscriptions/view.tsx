import { SidePanelLayout } from "@/components/layout/sidePanelLayout";
import { QuerySubscriptionsGrid } from "@/components/query-subscriptions/dataGrid";
import { QuerySubscriptionsListPane } from "@/components/query-subscriptions/tableListPane";
import { useQuerySubscriptionsState } from "@/components/query-subscriptions/useQuerySubscriptionsState";
import { useInspectorTables } from "@/hooks/useInspectorTables";

export function QuerySubscriptionsScreen(): React.ReactElement {
  const { tables } = useInspectorTables();
  const state = useQuerySubscriptionsState(tables);

  return (
    <SidePanelLayout>
      <SidePanelLayout.Panel>
        <QuerySubscriptionsListPane
          searchValue={state.listSearchValue}
          selectedPropagations={state.selectedPropagations}
          selectedTableName={state.selectedTableName}
          tableCount={state.tableCount}
          visibleTableNames={state.visibleTableNames}
          onPropagationSelectedChange={state.setPropagationSelected}
          onSearchValueChange={state.setListSearchValue}
          onSelectedTableNameChange={state.setSelectedTableName}
        />
      </SidePanelLayout.Panel>
      <SidePanelLayout.Content>
        <QuerySubscriptionsGrid state={state} />
      </SidePanelLayout.Content>
    </SidePanelLayout>
  );
}
