import { Box, Select } from "@inspector/ds";
import { type ReactElement } from "react";

const sizes = ["s", "m", "l"] as const;
const items = [
  { label: "Local", value: "local" },
  { label: "Production", value: "production" },
];

export default function SizesExample(): ReactElement {
  return (
    <Box gap="l" alignItems="end" flexWrap="wrap">
      {sizes.map((size) => (
        <Select.Root key={size} items={items} defaultValue="local">
          <Box flexDirection="column" gap="xs" alignItems="start">
            <Select.Label>{size.toUpperCase()}</Select.Label>
            <Select.Trigger size={size}>
              <Select.Value />
              <Select.Icon />
            </Select.Trigger>
          </Box>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {items.map((item) => (
                    <Select.Item key={item.value} value={item.value}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{item.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ))}
    </Box>
  );
}
