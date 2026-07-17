import { ContextMenu, KeyboardInput } from "@inspector/ds";
import { Copy, Pencil, X } from "lucide-react";
import { type ReactElement } from "react";

export default function PrefixSuffixExample(): ReactElement {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>Right-click this tab</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Pencil size={14} />
          </ContextMenu.Prefix>
          Rename tab
          <ContextMenu.Suffix>
            <KeyboardInput size="small">F2</KeyboardInput>
          </ContextMenu.Suffix>
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => undefined}>
          <ContextMenu.Prefix>
            <Copy size={14} />
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
            <X size={14} />
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
