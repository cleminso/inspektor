import { Box, Text } from "@inspector/ds";
import { type ReactElement, type ReactNode } from "react";

import { CodeBlock } from "@/components/docs/codeBlock";
import { DocsHeader } from "@/components/docs/docsHeader";
import { DocsPage } from "@/components/docs/docsPage";
import { navigationItems, type SourceReference } from "@/lib/registry";
import { useAppShellLayout } from "@/layout/appShellLayout";

interface ComponentDocsPageProps {
  title: string;
  description: string;
  source: SourceReference;
  preview: ReactNode;
  sourceCode: string;
  controls?: ReactNode;
  children?: ReactNode;
}

export function ComponentDocsPage({
  title,
  description,
  source,
  preview,
  sourceCode,
  controls,
  children,
}: ComponentDocsPageProps): ReactElement {
  const { isControlsOpen } = useAppShellLayout();
  const item = navigationItems.find((navigationItem) => navigationItem.source.path === source.path);

  if (item === undefined) {
    throw new Error(`No navigation item found for ${source.path}`);
  }

  return (
    <Box width="full" height="full" minWidth={0} minHeight={0} overflow="hidden">
      <Box flex={1} minWidth={0} minHeight={0} flexDirection="column" overflow="hidden">
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
          <Box
            as="section"
            aria-label={`${title} playground`}
            flexDirection="column"
            width="full"
            minWidth={0}
            padding="xl"
          >
            <Box
              flexDirection="column"
              width="full"
              minWidth={0}
              borderWidth={1}
              borderStyle="solid"
              borderColor="default"
              borderRadius="s"
              overflow="hidden"
              backgroundColor="surface-background"
            >
              <Box
                minHeight="panel-height"
                minWidth={0}
                alignItems="center"
                justifyContent="center"
                padding="2xl"
                overflowX="hidden"
              >
                {preview}
              </Box>
              <CodeBlock source={sourceCode} />
            </Box>
          </Box>

          {children !== undefined ? (
            <Box
              as="section"
              aria-label={`${title} documentation`}
              width="full"
              minWidth={0}
              flexDirection="column"
              paddingBottom="4xl"
            >
              <DocsPage width="full">{children}</DocsPage>
            </Box>
          ) : null}
        </Box>
      </Box>

      {isControlsOpen === true ? (
        <Box
          as="aside"
          aria-label={`${title} controls`}
          display={{ base: "none", xl: "flex" }}
          flexDirection="column"
          flexShrink={0}
          width="popup-width-m"
          minHeight={0}
          height="full"
          overflowY="hidden"
          data-scrollable="false"
          padding="m"
          gap="2xl"
          backgroundColor="surface-background"
        >
          <Text variant="body" color="muted">
            {description}
          </Text>
          {controls}
        </Box>
      ) : null}
    </Box>
  );
}
