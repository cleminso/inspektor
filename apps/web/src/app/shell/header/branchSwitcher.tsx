import {
  ContextSwitcher,
  Text,
  type ContextSwitcherTriggerSize,
  type ContextSwitcherTriggerWidth,
} from "@inspector/ds";

import { useInspector } from "@app/providers/inspectorProvider";

interface BranchSwitcherProps {
  size?: ContextSwitcherTriggerSize;
  triggerLabel?: string;
  width?: ContextSwitcherTriggerWidth;
}

export function BranchSwitcher({
  size = "s",
  triggerLabel,
  width = "content",
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
        size={size}
        width={width}
      >
        <Text as="span" color="inherit" truncate>
          {triggerLabel ?? currentBranch ?? "Select branch"}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Content>
        <ContextSwitcher.Search label="Search branches" placeholder="Search branches" />
        <ContextSwitcher.Viewport maxHeight="l">
          <ContextSwitcher.Empty>No remembered branches.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(branch: string) => (
              <ContextSwitcher.Item key={branch} value={branch}>
                <ContextSwitcher.ItemText label={branch} />
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Viewport>
      </ContextSwitcher.Content>
    </ContextSwitcher.Root>
  );
}
