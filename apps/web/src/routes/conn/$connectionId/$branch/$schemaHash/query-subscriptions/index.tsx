import { createFileRoute } from "@tanstack/react-router";

import { Box, Text } from "@inspector/ds";

export const Route = createFileRoute("/conn/$connectionId/$branch/$schemaHash/query-subscriptions/")({
  component: QuerySubscriptionsRoute,
});

function QuerySubscriptionsRoute(): React.ReactElement {
  return (
    <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="bg-page">
      <Text as="span" variant="label" color="muted">
        Query subscriptions
      </Text>
    </Box>
  );
}
