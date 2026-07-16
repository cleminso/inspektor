import { Box, Button } from "@inspector/ds";
import { type ReactElement } from "react";

export default function DisabledExample(): ReactElement {
  return (
    <Box alignItems="center" gap="l">
      <Button disabled size="s">
        Upload
      </Button>
      <Button disabled size="m">
        Upload
      </Button>
      <Button disabled size="l">
        Upload
      </Button>
    </Box>
  );
}
