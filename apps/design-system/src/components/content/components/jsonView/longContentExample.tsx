import { Box, JsonView } from "@inspector/ds";

const record = {
  description: `A long value for checking wrapping in a narrow inspector pane. ${"More detail. ".repeat(360)}`,
};

export default function LongContentExample() {
  return (
    <Box width="popup-width-s" minWidth={0}>
      <JsonView accessibilityLabel="Record with long content" data={record} />
    </Box>
  );
}
