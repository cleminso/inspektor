import { ContextMenu, KeyboardInput, Icon } from "@inspector/ds";
import { Copy, Pencil, X } from "lucide-react";
import { type ReactElement } from "react";

export default function PrefixSuffixExample(): ReactElement {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>Right-click this tab</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Icon render={<Pencil />} size="s" />
          </ContextMenu.Prefix>
          Rename tab
          <ContextMenu.Suffix>
            <KeyboardInput size="small">F2</KeyboardInput>
          </ContextMenu.Suffix>
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Icon render={<Copy />} size="s" />
          </ContextMenu.Prefix>
          Duplicate tab
          <ContextMenu.Suffix>
            <KeyboardInput modifiers={["meta"]} size="small" platform="macos">
              D
            </KeyboardInput>
          </ContextMenu.Suffix>
        </ContextMenu.Item>
        <ContextMenu.Item variant="danger" onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Icon render={<X />} size="s" />
          </ContextMenu.Prefix>
          Close tab
          <ContextMenu.Suffix>
            <KeyboardInput modifiers={["meta"]} size="small" platform="macos">
              W
            </KeyboardInput>
          </ContextMenu.Suffix>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
