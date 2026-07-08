import { useMemo, useState } from "react";
import { SplitIcon } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxSeparator,
} from "@regarde/ui/combobox";
import { Button } from "@regarde/ui/button";
import { cn } from "@regarde/ui/lib/utils";

import { useInspector } from "@/components/providers/inspectorProvider";

interface BranchSwitcherProps {
  placement?: "default" | "header";
  triggerLabel?: string;
  width?: "auto" | "sm";
}

export function BranchSwitcher({
  placement = "default",
  triggerLabel,
  width = "auto",
}: BranchSwitcherProps = {}): React.ReactElement {
  const { currentBranch, rememberedBranches, switchBranch } = useInspector();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const branches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return rememberedBranches;
    }

    return rememberedBranches.filter((branch) => branch.toLowerCase().includes(normalizedQuery));
  }, [query, rememberedBranches]);
  const triggerClassName = cn(
    "justify-start gap-2 rounded-xs",
    placement === "header" ? "h-7 px-1 text-secondary-foreground" : null,
    width === "sm" ? "max-w-[200px]" : null,
  );
  return (
    <Combobox<string>
      items={branches}
      value={currentBranch ?? undefined}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen === false) {
          setQuery("");
        }
      }}
    >
      <Button variant="ghost" size="sm" nativeButton={true} className={triggerClassName} render={<ComboboxTrigger />}>
        <SplitIcon className="size-3.5 rotate-90 text-current" />
        <span className="truncate">{triggerLabel ?? currentBranch ?? "Select branch"}</span>
      </Button>
      <ComboboxContent className="w-[320px] p-0">
        <div className="sticky top-0 z-10 bg-popover p-1">
          <ComboboxInput
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            onFocus={() => {
              setOpen(true);
            }}
            placeholder="Search branch..."
            aria-label="Search branch"
            showClear={false}
            showTrigger={false}
          />
        </div>
        <ComboboxSeparator />
        <ComboboxEmpty>No remembered branches.</ComboboxEmpty>
        <ComboboxList className="max-h-80">
          {(branch) => (
            <ComboboxItem
              key={branch}
              value={branch}
              onClick={() => {
                setOpen(false);
                void switchBranch(branch);
              }}
            >
              <span className="truncate">{branch}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
