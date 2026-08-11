import { Box, Select } from "@inspector/ds";
import { type ReactElement } from "react";

const environments = [
  { label: "Local", value: "local" },
  { label: "Production", value: "production" },
];

export default function WidthsExample(): ReactElement {
  return (
    <Box flexDirection="column" gap="m">
      <Select.Root items={environments} defaultValue="local">
        <Select.Trigger aria-label="Content width" width="content" />
        <Select.Content>
          {environments.map((item) => (
            <Select.Item key={item.value} value={item.value}>
              {item.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root items={environments} defaultValue="production">
        <Select.Trigger aria-label="Full width" width="full" />
        <Select.Content>
          {environments.map((item) => (
            <Select.Item key={item.value} value={item.value}>
              {item.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Box>
  );
}
