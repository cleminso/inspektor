import type { PropsWithChildren } from "react";

import { inspectorShellStyle } from "#/layout/inspectorShell";

import { InspectorHeader } from "./inspectorHeader";
import { InspectorRail } from "./inspectorRail";

export function InspectorLayout({ children }: PropsWithChildren): React.ReactElement {
  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background text-foreground" style={inspectorShellStyle}>
      <InspectorRail />
      <div className="flex h-svh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
        <InspectorHeader />
        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
