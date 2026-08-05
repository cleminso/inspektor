import { Box, Input } from "@inspector/ds";
import { type ReactElement } from "react";

export default function TypographyExample(): ReactElement {
  return (
    <Box flexDirection="column" gap="l" width="full">
      <Input aria-label="Proportional value" defaultValue="Display name" fullWidth />
      <Input aria-label="Monospace value" defaultValue="019f01e8-3a21-7fa2-8d54-1537ab305925" font="mono" fullWidth />
    </Box>
  );
}
