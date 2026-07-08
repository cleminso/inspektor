import { ConnectionSwitcher } from "@/components/navigation";
import { ConnectionsView } from "@/components/onboarding/view";
import { inspectorShellStyle } from "#/layout/inspectorShell";

interface ConnectionsLayoutProps {
  pane: React.ReactNode;
}

export function ConnectionsLayout({ pane }: ConnectionsLayoutProps): React.ReactElement {
  const hasPane = pane !== null && pane !== undefined;

  return (
    <div className="flex h-svh min-h-0 w-full flex-col overflow-hidden" style={inspectorShellStyle}>
      <header className="flex h-10 w-full shrink-0 items-center border-b border-border bg-secondary px-3 py-1">
        <ConnectionSwitcher placement="header" triggerLabel="Open connection" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col justify-between lg:flex-row">
        <ConnectionsView />
        {hasPane === true ? pane : null}
      </div>
    </div>
  );
}
