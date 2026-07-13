import { Button, Combobox } from "@inspector/ds";
import { type ReactElement, useState } from "react";

interface Connection {
  id: string;
  name: string;
  appId: string;
}

const connections: Connection[] = [
  { id: "storefront", name: "Storefront", appId: "storefront-production" },
  { id: "dashboard", name: "Dashboard", appId: "dashboard-development" },
  { id: "sandbox", name: "Sandbox", appId: "local-sandbox" },
];

export default function ConnectionSwitcherExample(): ReactElement {
  const [connection, setConnection] = useState<Connection | null>(connections[0] ?? null);
  const [open, setOpen] = useState(false);

  return (
    <Combobox.Root
      items={connections}
      value={connection}
      onValueChange={setConnection}
      open={open}
      onOpenChange={setOpen}
      itemToStringLabel={(item) => item.name}
      isItemEqualToValue={(item, selected) => item.id === selected.id}
      filter={(item, query) =>
        `${item.name} ${item.appId}`.toLowerCase().includes(query.trim().toLowerCase())
      }
    >
      <Combobox.Trigger variant="ghost" aria-label="Switch connection">
        <Combobox.Value placeholder="Open connections" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup width="m" aria-label="Connections">
            <Combobox.PopupHeader>
              <Combobox.InputGroup>
                <Combobox.Input aria-label="Search connections" placeholder="Search connections" />
              </Combobox.InputGroup>
            </Combobox.PopupHeader>
            <Combobox.Separator />
            <Combobox.Viewport maxHeight="m">
              <Combobox.Empty>No saved connections.</Combobox.Empty>
              <Combobox.List>
                {(item: Connection) => (
                  <Combobox.Item key={item.id} value={item}>
                    <Combobox.ItemText label={item.name} description={item.appId} />
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Viewport>
            <Combobox.Separator />
            <Combobox.PopupFooter>
              <Button variant="ghost" size="s" fullWidth justify="start" onClick={() => setOpen(false)}>
                Add new connection
              </Button>
            </Combobox.PopupFooter>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
