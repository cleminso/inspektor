import { Box, Text } from "@inspector/ds";
import { type ReactElement } from "react";

import { SourceLink } from "@/components/docs/sourceLink";
import { type SourceReference } from "@/lib/registry";

interface PageHeaderProps {
  title: string;
  description: string;
  source?: SourceReference;
}

export function PageHeader({ title, description, source }: PageHeaderProps): ReactElement {
  return (
    <Box
      as="header"
      flexDirection="column"
      gap="l"
      paddingBottom="2xl"
      borderBottomWidth={1}
      borderStyle="solid"
      borderColor="border"
    >
      <Box flexDirection="row" alignItems="center" justifyContent="between" gap="xl">
        <Text as="h1" variant="heading-s" style={{ margin: 0 }}>
          {title}
        </Text>
        {source !== undefined ? <SourceLink source={source} /> : null}
      </Box>
      <Text variant="body" color="muted" style={{ margin: 0, maxWidth: 680 }}>
        {description}
      </Text>
    </Box>
  );
}
