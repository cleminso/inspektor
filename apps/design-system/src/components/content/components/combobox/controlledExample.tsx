import { Combobox, Field } from "@inspector/ds";
import { type ReactElement, useState } from "react";

const tables = ["accounts", "projects", "sessions", "users"];

export default function ControlledExample(): ReactElement {
  const [table, setTable] = useState<string | null>("projects");

  return (
    <Field.Root name="table">
      <Field.Label>Table</Field.Label>
      <Combobox.Root items={tables} value={table} onValueChange={setTable}>
        <Combobox.InputGroup>
          <Combobox.Input placeholder="Filter tables" />
          <Combobox.Clear />
          <Combobox.InputTrigger />
        </Combobox.InputGroup>
        <Combobox.Content>
          <Combobox.Empty>No tables found.</Combobox.Empty>
          <Combobox.List>
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Content>
      </Combobox.Root>
    </Field.Root>
  );
}
