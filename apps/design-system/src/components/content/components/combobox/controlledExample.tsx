import { Combobox, Field } from "@inspector/ds";
import { type ReactElement, useState } from "react";

interface Table {
  id: string;
  name: string;
  namespace: string;
}

const tables: Table[] = [
  { id: "accounts", name: "Accounts", namespace: "public.accounts" },
  { id: "projects", name: "Projects", namespace: "public.projects" },
  { id: "sessions", name: "Sessions", namespace: "auth.sessions" },
  { id: "users", name: "Users", namespace: "auth.users" },
];

export default function ControlledExample(): ReactElement {
  const [table, setTable] = useState<Table | null>(tables[1] ?? null);

  return (
    <Field.Root name="table">
      <Field.Label>Table</Field.Label>
      <Combobox.Root
        items={tables}
        value={table}
        onValueChange={setTable}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
      >
        <Combobox.InputGroup>
          <Combobox.Input placeholder="Filter tables" />
          <Combobox.Clear />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content>
          <Combobox.Empty>No tables found.</Combobox.Empty>
          <Combobox.List>
            {(item: Table) => (
              <Combobox.Item key={item.id} value={item}>
                <Combobox.ItemText label={item.name} description={item.namespace} />
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>
    </Field.Root>
  );
}
