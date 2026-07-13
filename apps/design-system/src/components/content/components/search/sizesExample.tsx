import { Box, Search } from "@inspector/ds";
import { type ReactElement } from "react";

export default function SizesExample(): ReactElement {
  return (
    <Box flexDirection="column" gap="m" alignItems="start">
      <Search size="s" aria-label="Small search" placeholder="Small" fullWidth={false} />
      <Search size="m" aria-label="Medium search" placeholder="Medium" fullWidth={false} />
      <Search size="l" aria-label="Large search" placeholder="Large" fullWidth={false} />
    </Box>
  );
}
