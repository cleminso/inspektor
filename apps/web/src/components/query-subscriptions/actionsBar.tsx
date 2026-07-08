import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Badge } from "@regarde/ui/badge";
import { Button } from "@regarde/ui/button";

interface ActionsBarProps {
  error: string | null;
  generatedAt: number | null;
  isListPaneOpen: boolean;
  isRefreshing: boolean;
  onToggleListPane: () => void;
  rowCount: number;
}

function formatLastRefresh(generatedAt: number | null): string {
  if (generatedAt === null) {
    return "Polling every 20s.";
  }

  return `Polling every 20s. Last refresh ${new Date(generatedAt).toLocaleTimeString()}.`;
}

export function ActionsBar({
  error,
  generatedAt,
  isListPaneOpen,
  isRefreshing,
  onToggleListPane,
  rowCount,
}: ActionsBarProps): React.ReactElement {
  const statusText = `${formatLastRefresh(generatedAt)}${isRefreshing === true ? " Refreshing..." : ""}`;

  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggleListPane}
        >
          {isListPaneOpen === true ? <PanelLeftClose /> : <PanelLeftOpen />}
          <span className="sr-only">Toggle query subscriptions table list</span>
        </Button>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
        <p>{statusText}</p>
        {error !== null && rowCount > 0 ? (
          <Badge variant="destructive" size="sm">
            {error}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
