import { Box, Button } from "@inspector/ds";
import { Link } from "@tanstack/react-router";

import { type ReactElement } from "react";

import { PageHeader } from "@/components/docs/pageHeader";


export function HomePage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title="Inspector Design System"
        description="Foundations and components used to build consistent inspector interfaces."
      />
    </Box>
  );
}

export function NotFoundPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title="Page not found"
        description="This design-system page does not exist or is not documented."
      />
      <Button variant="outline" render={<Link to="/" />}>
        Return to the catalog
      </Button>
    </Box>
  );
}
