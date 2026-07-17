import { Button, Menu } from "@inspector/ds";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { type ReactElement } from "react";

export default function PrefixSuffixExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="outline" />}>Edit</Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>
          <Menu.Prefix>
            <Pencil size={14} />
          </Menu.Prefix>
          Rename
          <Menu.Suffix>F2</Menu.Suffix>
        </Menu.Item>
        <Menu.Item onClick={() => undefined}>
          <Menu.Prefix>
            <Copy size={14} />
          </Menu.Prefix>
          Duplicate
          <Menu.Suffix>Ctrl+D</Menu.Suffix>
        </Menu.Item>
        <Menu.Item variant="danger" onClick={() => undefined}>
          <Menu.Prefix>
            <Trash2 size={14} />
          </Menu.Prefix>
          Delete
          <Menu.Suffix>Del</Menu.Suffix>
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
