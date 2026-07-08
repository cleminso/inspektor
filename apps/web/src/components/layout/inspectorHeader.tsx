import { BranchSwitcher, ConnectionSwitcher, SchemaSwitcher } from "@/components/navigation";

export function InspectorHeader(): React.ReactElement {
  return (
    <header className="flex h-10 items-center gap-2 border-b border-border bg-secondary px-3">
      <div className="flex min-w-0 items-center gap-2">
        <ConnectionSwitcher placement="header" width="md" />
        <div className="flex min-w-0 items-center gap-1 text-secondary-foreground">
          <BranchSwitcher placement="header" width="sm" />
          <span aria-hidden="true" className="shrink-0 text-secondary-foreground">
            /
          </span>
          <SchemaSwitcher placement="header" width="md" />
        </div>
      </div>
    </header>
  );
}
