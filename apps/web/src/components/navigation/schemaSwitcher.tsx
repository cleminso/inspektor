import { HashIcon } from "lucide-react";

import { ContextSwitcher, Text } from "@inspector/ds";

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
  const triggerText = triggerLabel ?? currentSchemaHash ?? "Select schema";
  const triggerTitle = triggerLabel ?? currentSchemaHash ?? undefined;
  const shouldTruncateCurrentSchema =
    currentSchemaHash !== null && triggerText === currentSchemaHash;
  const displayTriggerText =
    shouldTruncateCurrentSchema === true
      ? truncateMiddle(currentSchemaHash, 24)
      : triggerText;
  return (
    <ContextSwitcher.Root<string>
      items={runtime.availableSchemaHashes}
      value={currentSchemaHash}
      onValueChange={(schemaHash) => {
        if (schemaHash !== null) {
          void switchSchema(schemaHash);
        }
      }}
    >
      <ContextSwitcher.Trigger
        label="Switch schema"
        size={placement === "header" ? "m" : "l"}
        width={width === "md" ? "m" : "content"}
        title={triggerTitle}
      >
        <HashIcon aria-hidden="true" size={14} />
        <Text as="span" color="inherit" monospace truncate>
          {displayTriggerText}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content width="content">
        <ContextSwitcher.Search label="Search schemas" placeholder="Search schemas" />
        <ContextSwitcher.Viewport maxHeight="l">
          {runtime.isLoading === true ? (
            <ContextSwitcher.Status>Loading schemas...</ContextSwitcher.Status>
          ) : (
            <>
              <ContextSwitcher.Empty>No schemas available.</ContextSwitcher.Empty>
              <ContextSwitcher.List>
                {(schemaHash: string) => (
                  <ContextSwitcher.Item key={schemaHash} value={schemaHash}>
                    <Text as="span" color="inherit" monospace>
                      {schemaHash}
                    </Text>
                  </ContextSwitcher.Item>
                )}
              </ContextSwitcher.List>
            </>
          )}
        </ContextSwitcher.Viewport>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  );
}
