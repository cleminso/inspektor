import { Select } from "@inspector/ds";
import { type ReactElement } from "react";

const options = [
  { label: "Main", value: "main" },
  { label: "Develop", value: "develop" },
  { label: "Schema preview", value: "schema-preview" },
];

export default function DefaultOptionsExample(): ReactElement {
  return (
    <Select.Root items={options} defaultValue="main">
      <Select.Trigger aria-label="Branch" placeholder="Select a branch" />
      <Select.Content>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
