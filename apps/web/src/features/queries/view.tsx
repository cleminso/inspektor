import { Box, Text } from "@inspector/ds";

export function QueriesView(): React.ReactElement {
  return (
    <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="bg-page">
      <Text as="span" variant="label" color="muted">
        Query subscriptions
      </Text>
    </Box>
  );
}
