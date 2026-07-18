import { Box, Spinner } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Box alignItems="center" gap="s">
      <Spinner />
    </Box>
  );
}
