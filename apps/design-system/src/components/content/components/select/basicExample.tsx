import { Box, Select } from "@inspector/ds";
import { type ReactElement } from "react";

const branches = [
  { label: "Main", value: "main" },
  { label: "Develop", value: "develop" },
  { label: "Schema preview", value: "schema-preview" },
];

export default function BasicExample(): ReactElement {
  return (
    <Select.Root items={branches} defaultValue="main">
      <Box flexDirection="column" gap="xs" alignItems="start">
        <Select.Label>Branch</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder="Select a branch" />
          <Select.Icon />
        </Select.Trigger>
      </Box>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              {branches.map((branch) => (
                <Select.Item key={branch.value} value={branch.value}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{branch.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
