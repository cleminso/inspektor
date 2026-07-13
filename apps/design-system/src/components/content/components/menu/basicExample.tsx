import { Menu } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger>Connection actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Group>
              <Menu.Item onClick={() => undefined}>
                Rename
                <Menu.Shortcut>⌘R</Menu.Shortcut>
              </Menu.Item>
              <Menu.Item onClick={() => undefined}>
                Duplicate
                <Menu.Shortcut>⌘D</Menu.Shortcut>
              </Menu.Item>
            </Menu.Group>
            <Menu.Separator />
            <Menu.Group>
              <Menu.Item disabled>Delete active connection</Menu.Item>
              <Menu.Item variant="danger" onClick={() => undefined}>
                Delete connection
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
