import { Box, Button } from "@inspector/ds";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { type ReactElement } from "react";

export default function GlyphCompositionExample(): ReactElement {
  return (
    <Box alignItems="center" flexWrap="wrap" gap="l">
      <Button prefix={<Button.Glyph artwork={ArrowLeft} />}>Previous</Button>
      <Button suffix={<Button.Glyph artwork={ArrowRight} />} variant="secondary">
        Continue
      </Button>
      <Button iconOnly aria-label="Add item" variant="ghost">
        <Button.Glyph artwork={Plus} />
      </Button>
    </Box>
  );
}
