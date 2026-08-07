import { Box, Select } from "@inspector/ds";
import { type ReactElement } from "react";

const pageSizes = [
  { label: "100", value: 100 },
  { label: "500", value: 500 },
  { label: "1000", value: 1000 },
];

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

      <Select.Root items={pageSizes} defaultValue={100}>
        <Select.Trigger aria-label="Compact stable width" size="s" width="compact" />
        <Select.Content>
          {pageSizes.map((item) => (
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
