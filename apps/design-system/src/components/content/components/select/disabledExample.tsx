import { Box, Select } from "@inspector/ds";
import { type ReactElement } from "react";

const roles = [
  { label: "Viewer", value: "viewer" },
  { label: "Editor", value: "editor" },
  { label: "Owner", value: "owner" },
];

export default function DisabledExample(): ReactElement {
  return (
    <Box gap="m" flexWrap="wrap">
      <Select.Root items={roles} defaultValue="viewer" disabled>
        <Select.Trigger aria-label="Disabled role" />
        <Select.Content>
          {roles.map((role) => (
            <Select.Item key={role.value} value={role.value}>
              {role.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root items={roles} defaultValue="editor">
        <Select.Trigger aria-label="Role with unavailable option" />
        <Select.Content>
          <Select.Item value="viewer">Viewer</Select.Item>
          <Select.Item value="editor">Editor</Select.Item>
          <Select.Item value="owner" disabled>
            Owner
          </Select.Item>
        </Select.Content>
      </Select.Root>
    </Box>
  );
}
