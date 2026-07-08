import { Link } from "@tanstack/react-router";

import { Button } from "@regarde/ui/button";
import { CopyButton } from "@regarde/ui/copyButton";

import { useInspector } from "@/components/providers/inspectorProvider";
import { buildExplorerLink } from "@/lib/query-subscriptions/buildExplorerUrl";
import type { QuerySubscriptionRow } from "@/types/QuerySubscriptions";

function formatQuery(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

interface QuerySubscriptionsExpandedRowProps {
  row: QuerySubscriptionRow;
}

export function QuerySubscriptionsExpandedRow({ row }: QuerySubscriptionsExpandedRowProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();

  const formattedQuery = formatQuery(row.query);

  const explorerLink =
    currentConnectionId !== null && currentBranch !== null && currentSchemaHash !== null
      ? buildExplorerLink({
          connectionId: currentConnectionId,
          branch: currentBranch,
          schemaHash: currentSchemaHash,
          tableName: row.table,
          query: row.query,
        })
      : null;

  return (
    <div className="flex flex-col gap-4 border-border bg-muted/20 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Query</p>
          <p className="text-xs text-muted-foreground">Grouped server subscription for `{row.table}`.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {explorerLink !== null ? (
            <Button size="lg" variant="secondary" render={<Link {...explorerLink} />}>
              Open in table explorer
            </Button>
          ) : null}
          <CopyButton text={row.query} size="icon-lg" variant="secondary" />
        </div>
      </div>
      <pre className="app-scrollbar max-w-full overflow-x-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">{formattedQuery}</pre>
    </div>
  );
}
