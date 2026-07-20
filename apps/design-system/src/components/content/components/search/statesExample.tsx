import { Box, Search } from "@inspector/ds";
import { type ReactElement } from "react";

export default function StatesExample(): ReactElement {
  return (
    <Box flexDirection="column" gap="m" width="popup-width-m">
      <Search aria-label="Search commands" placeholder="Search commands" shortcut="command-k" />
      <Search
        aria-label="Disabled search"
        placeholder="Search unavailable"
        shortcut="command-k"
        disabled
      />
    </Box>
  );
}
