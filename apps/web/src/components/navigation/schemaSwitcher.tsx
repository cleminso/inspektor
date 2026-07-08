import { useMemo, useState } from "react";
import { HashIcon } from "lucide-react";

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

interface SchemaSwitcherProps {
  placement?: "default" | "header";
  triggerLabel?: string;
  width?: "auto" | "md";
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const ellipsis = "…";
  const remainingLength = maxLength - ellipsis.length;
  const startLength = Math.ceil(remainingLength / 2);
  const endLength = Math.floor(remainingLength / 2);

  return `${value.slice(0, startLength)}${ellipsis}${value.slice(value.length - endLength)}`;
}

export function SchemaSwitcher({
  placement = "default",
  triggerLabel,
  width = "auto",
}: SchemaSwitcherProps = {}): React.ReactElement {
  const { currentSchemaHash, runtime, switchSchema } = useInspector();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const schemaHashes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return runtime.availableSchemaHashes;
    }

    return runtime.availableSchemaHashes.filter((schemaHash) => schemaHash.toLowerCase().includes(normalizedQuery));
  }, [query, runtime.availableSchemaHashes]);

  const triggerText = triggerLabel ?? currentSchemaHash ?? "Select schema";
  const triggerTitle = triggerLabel ?? currentSchemaHash ?? undefined;
  const shouldTruncateCurrentSchema =
    currentSchemaHash !== null && triggerText === currentSchemaHash;
  const displayTriggerText =
    shouldTruncateCurrentSchema === true
      ? truncateMiddle(currentSchemaHash, 24)
      : triggerText;
  const triggerClassName = cn(
    "justify-start gap-2 rounded-xs",
    placement === "header" ? "h-7 px-1 text-secondary-foreground" : null,
    width === "md" ? "max-w-[280px]" : null,
  );
  return (
    <Combobox<string>
      items={schemaHashes}
      value={currentSchemaHash ?? undefined}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen === false) {
          setQuery("");
        }
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        nativeButton={true}
        className={triggerClassName}
        render={<ComboboxTrigger />}
        title={triggerTitle}
      >
        <HashIcon className="size-3.5 text-current" />
        <span className="block whitespace-nowrap font-mono">{displayTriggerText}</span>
      </Button>
      <ComboboxContent className="w-max min-w-(--anchor-width) max-w-[calc(100vw-2rem)] p-0">
        <div className="sticky top-0 z-10 bg-popover p-1">
          <ComboboxInput
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
            onFocus={() => {
              setOpen(true);
            }}
            placeholder="Search schemas..."
            aria-label="Search schemas"
            showClear={false}
            showTrigger={false}
          />
        </div>
        <ComboboxSeparator />
        <ComboboxEmpty>
          {runtime.isLoading === true ? "Loading schemas..." : "No schemas available."}
        </ComboboxEmpty>
        <ComboboxList className="max-h-80">
          {(schemaHash) => (
            <ComboboxItem
              key={schemaHash}
              value={schemaHash}
              className="pr-8"
              onClick={() => {
                setOpen(false);
                void switchSchema(schemaHash);
              }}
            >
              <span className="block whitespace-nowrap font-mono">{schemaHash}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
