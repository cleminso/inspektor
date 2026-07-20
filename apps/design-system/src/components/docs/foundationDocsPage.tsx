import { Box, Text } from "@inspector/ds";
import { type ReactElement, type ReactNode } from "react";

import { DocsHeader } from "@/components/docs/docsHeader";
import { DocsPage } from "@/components/docs/docsPage";
import { type NavItem } from "@/lib/registry";

interface FoundationDocsPageProps {
  item: NavItem;
  children: ReactNode;
}

export function FoundationDocsPage({ item, children }: FoundationDocsPageProps): ReactElement {
  return (
    <Box
      width="full"
      height="full"
      minWidth={0}
      minHeight={0}
      flexDirection="column"
      overflow="hidden"
    >
      <DocsHeader item={item} />
      <Box
        flex={1}
        width="full"
        minWidth={0}
        minHeight={0}
        flexDirection="column"
        overflowX="hidden"
        overflowY="auto"
        data-scroll-area="main-content"
        data-scroll-fade="top"
      >
        <DocsPage>
          <Box display="block" maxWidth="content-measure">
            <Text variant="body" color="muted">
              {item.description}
            </Text>
          </Box>
          {children}
        </DocsPage>
      </Box>
    </Box>
  );
}
