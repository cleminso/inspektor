import { Box, Text } from "@inspector/ds";
import { type ReactElement, type ReactNode } from "react";

interface SectionProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function Section({ title, description, children }: SectionProps): ReactElement {
  return (
    <Box as="section" flexDirection="column" gap="xl">
      <Box flexDirection="column" gap="xs">
        <Text as="h2" variant="heading-xs">
          {title}
        </Text>
        {description !== undefined ? (
          <Text variant="body" color="muted">
            {description}
          </Text>
        ) : null}
      </Box>
      {children}
    </Box>
  );
}
