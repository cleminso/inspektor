import { Box, Select } from "@inspector/ds";
import { type ReactElement } from "react";

const regions = [
  { label: "Washington, D.C.", value: "iad" },
  { label: "Frankfurt", value: "fra" },
  { label: "Singapore", value: "sin" },
];

export default function LabelExample(): ReactElement {
  return (
    <Select.Root items={regions} defaultValue="iad">
      <Box flexDirection="column" gap="xs" alignItems="start">
        <Select.Label>Region</Select.Label>
        <Select.Trigger width="full" />
      </Box>
      <Select.Content>
        {regions.map((region) => (
          <Select.Item key={region.value} value={region.value}>
            {region.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
