import { Box, Button } from "@inspector/ds";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ReactElement } from "react";

export default function PrefixAndSuffixExample(): ReactElement {
  return (
    <Box alignItems="center" flexWrap="wrap" gap="l">
      <Button prefix={<ArrowLeft size={14} />}>Upload</Button>
      <Button suffix={<ArrowRight size={14} />}>Upload</Button>
      <Button prefix={<ArrowLeft size={14} />} suffix={<ArrowRight size={14} />}>
        Upload
      </Button>
    </Box>
  );
}
