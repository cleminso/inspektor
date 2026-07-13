import { Menu } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function CheckboxExample(): ReactElement {
  const [showSystemTables, setShowSystemTables] = useState(false);

  return (
    <Menu.Root>
      <Menu.Trigger>Table options</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Group>
              <Menu.GroupLabel>Visibility</Menu.GroupLabel>
              <Menu.CheckboxItem checked={showSystemTables} onCheckedChange={setShowSystemTables}>
                <Menu.CheckboxItemIndicator />
                Show system tables
              </Menu.CheckboxItem>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
