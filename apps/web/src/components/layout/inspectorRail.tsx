import { Link, useMatchRoute } from "@tanstack/react-router";
import { CodeXml, Moon, Sun, TableProperties } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@regarde/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@regarde/ui/tooltip";
import { cn } from "@regarde/ui/lib/utils";

import { useInspector } from "@/components/providers/inspectorProvider";
import { inspectorRailWidthClassName } from "#/layout/inspectorShell";
import { appRoutes } from "@/lib/navigation/appRoutes";

export function InspectorRail(): React.ReactElement {
  const matchRoute = useMatchRoute();
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

  const routeParams =
    currentConnectionId !== null && currentBranch !== null && currentSchemaHash !== null
      ? {
          branch: currentBranch,
          connectionId: currentConnectionId,
          schemaHash: currentSchemaHash,
        }
      : null;

  const isTablesActive =
    routeParams !== null && matchRoute({ to: appRoutes.tables, params: routeParams, fuzzy: true }) !== false;

  const isQuerySubscriptionsActive =
    routeParams !== null && matchRoute({ to: appRoutes.QuerySubscriptions, params: routeParams, fuzzy: true }) !== false;

  return (
    <aside
      className={cn(
        "flex min-h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        inspectorRailWidthClassName,
      )}
    >
      <nav aria-label="Inspector navigation" className="flex flex-1 flex-col items-center gap-1 px-1.5 py-9.5">
        <Tooltip>
          <TooltipTrigger
            render={
              routeParams !== null ? (
              <Button
                variant={isTablesActive === true ? "default" : "ghost"}
                size="icon-lg"
                nativeButton={false}
                render={<Link to={appRoutes.tables} params={routeParams} />}
                aria-current={isTablesActive === true ? "page" : undefined}
              >
                <TableProperties />
                <span className="sr-only">Tables</span>
              </Button>
              ) : (
              <Button type="button" variant="ghost" size="icon-lg" disabled>
                <TableProperties />
                <span className="sr-only">Tables</span>
              </Button>
              )
            }
          />
          <TooltipContent side="right">Tables</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              routeParams !== null ? (
              <Button
                variant={isQuerySubscriptionsActive === true ? "default" : "ghost"}
                size="icon-lg"
                nativeButton={false}
                render={<Link to={appRoutes.QuerySubscriptions} params={routeParams} />}
                aria-current={isQuerySubscriptionsActive === true ? "page" : undefined}
              >
                <CodeXml />
                <span className="sr-only">Query Subscriptions</span>
              </Button>
              ) : (
              <Button type="button" variant="ghost" size="icon-lg" disabled>
                <CodeXml />
                <span className="sr-only">Query Subscriptions</span>
              </Button>
              )
            }
          />
          <TooltipContent side="right">Query Subscriptions</TooltipContent>
        </Tooltip>
      </nav>
      <div className="flex shrink-0 flex-col items-center px-1.5 py-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setTheme(isDarkTheme === true ? "light" : "dark");
                }}
              >
                {isDarkTheme === true ? <Sun /> : <Moon />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            }
          />
          <TooltipContent side="right">{isDarkTheme === true ? "Light theme" : "Dark theme"}</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
