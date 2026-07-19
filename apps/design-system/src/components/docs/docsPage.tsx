import { Box } from "@inspector/ds";
import { type ReactElement, type ReactNode } from "react";

interface DocsPageProps {
  children: ReactNode;
}

export function DocsPage({ children }: DocsPageProps): ReactElement {
  return (
    <Box
      display="block"
      width="full"
      marginHorizontal="auto"
      maxWidth={{ base: "content-width", xl: "content-width-wide" }}
    >
      <Box flexDirection="column" gap="4xl" padding="xl">
        {children}
      </Box>
    </Box>
  );
}
