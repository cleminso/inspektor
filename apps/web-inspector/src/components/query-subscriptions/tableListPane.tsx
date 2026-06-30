import { Search } from "@regarde/ui/search";
import { Badge } from "@regarde/ui/badge";
import { EmptyState } from "@regarde/ui/emptyState";
import { cn } from "@regarde/ui/lib/utils";

import type { QuerySubscriptionTableItem } from "@/types/QuerySubscriptions";

interface QuerySubscriptionsListPaneProps {
  isInitialLoading: boolean;
  searchValue: string;
  selectedTableName: string | null;
  visibleTableItems: QuerySubscriptionTableItem[];
  onSearchValueChange: (value: string) => void;
  onSelectedTableNameChange: (value: string | null) => void;
}

export function QuerySubscriptionsListPane({
  isInitialLoading,
  searchValue,
  selectedTableName,
  visibleTableItems,
  onSearchValueChange,
  onSelectedTableNameChange,
}: QuerySubscriptionsListPaneProps): React.ReactElement {
  const shouldShowEmptyState = isInitialLoading === false && visibleTableItems.length === 0;
  const emptyStateDescription =
    searchValue.trim().length === 0 ? "No active server subscriptions found." : "Try a different table search.";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <Search
          aria-label="Search query subscriptions tables"
          value={searchValue}
          onChange={(event) => {
            onSearchValueChange(event.currentTarget.value);
          }}
          placeholder="Search tables..."
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <div
          className="flex flex-col gap-1"
          role="listbox"
          aria-label="Query subscriptions table filter"
          aria-busy={isInitialLoading === true}
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedTableName === null}
            onClick={() => {
              onSelectedTableNameChange(null);
            }}
            className={cn(
              "flex min-h-7 w-full items-center justify-between rounded-xs px-3 text-sm text-foreground",
              selectedTableName === null ? "bg-muted" : "hover:bg-muted/60",
            )}
          >
            <span className="truncate">All tables</span>
          </button>
          {isInitialLoading === true ? (
            <EmptyState title="Loading tables" description="Fetching active server subscriptions." />
          ) : shouldShowEmptyState === true ? (
            <EmptyState title="No tables found" description={emptyStateDescription} />
          ) : (
            visibleTableItems.map((tableItem) => {
              const isActive = selectedTableName === tableItem.tableName;

              return (
                <button
                  key={tableItem.tableName}
                  type="button"
                  role="option"
                  aria-selected={isActive === true}
                  onClick={() => {
                    onSelectedTableNameChange(tableItem.tableName);
                  }}
                  className={cn(
                    "flex min-h-7 w-full items-center justify-between rounded-xs px-3 text-sm text-foreground",
                    isActive === true ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span className="truncate">{tableItem.tableName}</span>
                  <Badge variant="secondary" size="sm" aria-label={`${tableItem.subscriptionCount} subscriptions`}>
                    {tableItem.subscriptionCount}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
