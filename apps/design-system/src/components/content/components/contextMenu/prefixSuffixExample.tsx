import { ContextMenu, Icon } from "@inspector/ds";
import { Copy, Pencil, X } from "lucide-react";
import { type ReactElement } from "react";

export default function PrefixSuffixExample(): ReactElement {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>Right-click this tab</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Icon artwork={Pencil} size="s" />
          </ContextMenu.Prefix>
          Rename tab
          <ContextMenu.Shortcut hotkey="F2" />
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Icon artwork={Copy} size="s" />
          </ContextMenu.Prefix>
          Duplicate tab
          <ContextMenu.Shortcut hotkey="Mod+D" />
        </ContextMenu.Item>
        <ContextMenu.Item variant="danger" onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Icon artwork={X} size="s" />
          </ContextMenu.Prefix>
          Close tab
          <ContextMenu.Shortcut hotkey="Mod+W" />
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
