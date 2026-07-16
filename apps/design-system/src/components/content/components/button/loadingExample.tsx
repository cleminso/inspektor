import { Box, Button } from "@inspector/ds";
import { type ReactElement } from "react";

export default function LoadingExample(): ReactElement {
  return (
    <Box alignItems="center" gap="l">
      <Button loading size="s">
        Upload
      </Button>
      <Button loading size="m">
        Upload
      </Button>
      <Button loading size="l">
        Upload
      </Button>
    </Box>
  );
}
