import { Box, CopyButton } from "@inspector/ds";
import { type ReactElement } from "react";

export default function VariantsExample(): ReactElement {
  return (
    <Box alignItems="center" gap="m">
      <CopyButton textToCopy="Ghost action" label="Copy ghost action" variant="ghost" />
      <CopyButton
        textToCopy="Secondary action"
        label="Copy secondary action"
        size="icon-m"
        variant="secondary"
      />
      <CopyButton
        textToCopy="Outlined action"
        label="Copy outlined action"
        size="icon-l"
        variant="outline"
      />
    </Box>
  );
}
