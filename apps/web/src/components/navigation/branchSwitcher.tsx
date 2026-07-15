import { SplitIcon } from "lucide-react";

import { ContextSwitcher, Text } from "@inspector/ds";

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
  return (
    <ContextSwitcher.Root<string>
      items={rememberedBranches}
      value={currentBranch}
      onValueChange={(branch) => {
        if (branch !== null) {
          void switchBranch(branch);
        }
      }}
    >
      <ContextSwitcher.Trigger
        label="Switch branch"
        size={placement === "header" ? "m" : "l"}
        width={width === "sm" ? "s" : "content"}
      >
        <SplitIcon aria-hidden="true" size={14} />
        <Text as="span" color="inherit" truncate>
          {triggerLabel ?? currentBranch ?? "Select branch"}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Popup>
        <ContextSwitcher.Search label="Search branches" placeholder="Search branches" />
        <ContextSwitcher.Content maxHeight="l">
          <ContextSwitcher.Empty>No remembered branches.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(branch: string) => (
              <ContextSwitcher.Item key={branch} value={branch}>
                <ContextSwitcher.ItemText label={branch} />
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Content>
      </ContextSwitcher.Popup>
    </ContextSwitcher.Root>
  );
}
