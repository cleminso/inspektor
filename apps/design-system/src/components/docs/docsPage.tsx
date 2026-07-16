import { Box } from "@inspector/ds";
import { type ReactElement, type ReactNode } from "react";

const docsPageMaxWidth = {
  base: 1220,
  xl: 1440,
} as const;

interface DocsPageProps {
  children: ReactNode;
}

export function DocsPage({ children }: DocsPageProps): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={docsPageMaxWidth} marginHorizontal="auto" padding="xl">
      {children}
    </Box>
  );
}
