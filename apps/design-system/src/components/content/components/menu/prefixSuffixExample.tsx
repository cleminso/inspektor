import { Button, KeyboardInput, Menu, Icon } from "@inspector/ds";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { type ReactElement } from "react";

export default function PrefixSuffixExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" />}>Edit</Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>
          <Menu.Prefix>
            <Icon render={<Pencil />} size="s" />
          </Menu.Prefix>
          Rename
          <Menu.Suffix>
            <KeyboardInput size="small">F2</KeyboardInput>
          </Menu.Suffix>
        </Menu.Item>
        <Menu.Item onClick={() => undefined}>
          <Menu.Prefix>
            <Icon render={<Copy />} size="s" />
          </Menu.Prefix>
          Duplicate
          <Menu.Suffix>
            <KeyboardInput modifiers={["meta"]} size="small" platform="macos">
              D
            </KeyboardInput>
          </Menu.Suffix>
        </Menu.Item>
        <Menu.Item variant="danger" onClick={() => undefined}>
          <Menu.Prefix>
            <Icon render={<Trash2 />} size="s" />
          </Menu.Prefix>
          Delete
          <Menu.Suffix>
            <KeyboardInput size="small">Del</KeyboardInput>
          </Menu.Suffix>
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
