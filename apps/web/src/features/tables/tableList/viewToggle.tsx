import { ToggleGroup } from "@inspector/ds";

import { useTableExplorerSearchParams } from "@tables/routing/useTableSearchParams";
import type { TableExplorerView } from "@tables/tableTypes";

export function TableViewToggle(): React.ReactElement {
  const { setView, view } = useTableExplorerSearchParams();

  return (
    <ToggleGroup<TableExplorerView>
      aria-label="Table view"
      value={[view]}
      width="full"
      itemWidth="equal"
      size="m"
      onValueChange={(nextValue) => {
        const nextView = nextValue[0];
        if (nextView !== undefined) {
          void setView(nextView);
        }
      }}
    >
      <ToggleGroup.Item value="data">Data</ToggleGroup.Item>
      <ToggleGroup.Item value="schema">Schema</ToggleGroup.Item>
    </ToggleGroup>
  );
}
