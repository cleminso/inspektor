import { Box, Button } from "@inspector/ds";
import { type ReactElement } from "react";

export default function SizesExample(): ReactElement {
  return (
    <Box alignItems="center" gap="l">
      <Button size="s">Size s</Button>
      <Button size="m">Size m</Button>
      <Button size="l">Size l</Button>
    </Box>
  );
}
