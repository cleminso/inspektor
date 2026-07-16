import { Box, Button } from "@inspector/ds";
import { type ReactElement } from "react";

export default function RoundedExample(): ReactElement {
  return (
    <Box alignItems="center" gap="l">
      <Button radius="xs" size="s">
        Upload
      </Button>
      <Button radius="s" size="s">
        Upload
      </Button>
      <Button radius="m" size="m">
        Upload
      </Button>
      <Button radius="l" size="l">
        Upload
      </Button>
      <Button radius="xl" size="l">
        Upload
      </Button>
    </Box>
  );
}
