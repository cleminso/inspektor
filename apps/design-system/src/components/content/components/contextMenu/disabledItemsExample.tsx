import { ContextMenu } from "@inspector/ds";
import { type ReactElement } from "react";

export default function DisabledItemsExample(): ReactElement {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>Right-click the only open tab</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => undefined}>Close tab</ContextMenu.Item>
        <ContextMenu.Item disabled>Close other tabs</ContextMenu.Item>
        <ContextMenu.Item disabled>Close tabs to the right</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
