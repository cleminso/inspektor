import { Box, Select } from "@inspector/ds";
import { GitBranch } from "lucide-react";
import { type ReactElement } from "react";

const branches = [
  { label: "Main", value: "main" },
  { label: "Develop", value: "develop" },
];

export default function PrefixAndSuffixExample(): ReactElement {
  return (
    <Box gap="m" flexWrap="wrap">
      <Select.Root items={branches} defaultValue="main">
        <Select.Trigger aria-label="Source branch" prefix={<GitBranch aria-hidden="true" size={14} />}>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {branches.map((branch) => (
            <Select.Item key={branch.value} value={branch.value}>
              {branch.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root items={branches} defaultValue="develop">
        <Select.Trigger aria-label="Target branch" suffix="Cmd 1">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {branches.map((branch) => (
            <Select.Item key={branch.value} value={branch.value}>
              {branch.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Box>
  );
}
