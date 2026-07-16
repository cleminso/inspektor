import { Box, Button } from "@inspector/ds";
import { Plus } from "lucide-react";
import { type ReactElement } from "react";

export default function ShapeExample(): ReactElement {
  return (
    <Box alignItems="center" gap="l">
      <Button aria-label="Add" shape="square" size="s">
        <Plus aria-hidden="true" size={12} />
      </Button>
      <Button aria-label="Add" shape="square" size="m">
        <Plus aria-hidden="true" size={14} />
      </Button>
      <Button aria-label="Add" shape="square" size="l">
        <Plus aria-hidden="true" size={16} />
      </Button>
    </Box>
  );
}
