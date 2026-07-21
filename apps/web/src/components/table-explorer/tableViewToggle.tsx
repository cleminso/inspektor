import { ToggleGroup } from "@inspector/ds";

import { useTableExplorerSearchParams } from "@/hooks/useTableExplorerSearchParams";
import type { TableExplorerView } from "@/types/tableExplorer";

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
