import { Link } from "@tanstack/react-router";

import { Button } from "@regarde/ui/button";

import { inspectorContentMaxWidthClassName } from "#/layout/inspectorShell";
import { appRoutes } from "@/lib/navigation/appRoutes";

import { ConnectionList } from "./connectionList";

interface ConnectionsSectionProps {
  children: React.ReactNode;
  title: string;
}

function ConnectionsSection({ children, title }: ConnectionsSectionProps): React.ReactElement {
  return (
    <section className="flex w-full flex-col items-start gap-2">
      <div className="flex w-full items-center gap-3 px-1">
        <h2 className="shrink-0 text-[11px] leading-4 font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className={`${inspectorContentMaxWidthClassName} flex w-full flex-col items-start`}>{children}</div>
    </section>
  );
}

export function ConnectionsView(): React.ReactElement {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
      <div className={`${inspectorContentMaxWidthClassName} flex w-full flex-col items-start gap-10`}>
        <ConnectionsSection title="Get started">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link to={appRoutes.newConnection} />}
            className="h-auto w-full justify-start rounded-xs border-transparent px-3 py-1 text-left text-sm font-normal text-foreground"
          >
            Add connection
          </Button>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<a href="https://jazz.tools/docs" target="_blank" rel="noreferrer" />}
            className="h-auto w-full justify-start rounded-xs border-transparent px-3 py-1 text-left text-sm font-normal text-foreground"
          >
            Jazz documentation
          </Button>
        </ConnectionsSection>

        <ConnectionsSection title="Recent connections">
          <ConnectionList />
        </ConnectionsSection>
      </div>
    </div>
  );
}
