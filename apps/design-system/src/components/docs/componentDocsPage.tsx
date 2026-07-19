import { Box, Button, Text } from "@inspector/ds";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, PanelLeft, PanelRight } from "lucide-react";
import { type ReactElement, type ReactNode } from "react";

import { CodeBlock } from "@/components/docs/codeBlock";
import { DocsPage } from "@/components/docs/docsPage";
import { SourceLink } from "@/components/docs/sourceLink";
import { navigationItems, type SourceReference } from "@/lib/registry";
import { useAppShellLayout } from "@/layout/appShellLayout";

interface ComponentDocsPageProps {
  title: string;
  description: string;
  source: SourceReference;
  preview: ReactNode;
  sourceCode: string;
  controls: ReactNode;
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
  const { isControlsOpen, isNavigationOpen, toggleControls, toggleNavigation } =
    useAppShellLayout();
  const navigate = useNavigate();
  const componentIndex = navigationItems.findIndex((item) => item.source.path === source.path);
  const previousComponent =
    componentIndex > 0 ? navigationItems[componentIndex - 1] : navigationItems.at(-1);
  const nextComponent =
    componentIndex >= 0 && componentIndex < navigationItems.length - 1
      ? navigationItems[componentIndex + 1]
      : navigationItems[0];
  const navigatePrevious = (): void => {
    if (previousComponent !== undefined) {
      void navigate({ to: previousComponent.href });
    }
  };
  const navigateNext = (): void => {
    if (nextComponent !== undefined) {
      void navigate({ to: nextComponent.href });
    }
  };

  return (
    <Box width="full" height="full" minWidth={0} minHeight={0} overflow="hidden">
      <Box flex={1} minWidth={0} minHeight={0} flexDirection="column" overflow="hidden">
        <Box
          as="header"
          alignItems="center"
          justifyContent="between"
          gap="l"
          flexShrink={0}
          padding="m"
          borderBottomWidth={1}
          borderStyle="solid"
          borderColor="border"
          backgroundColor="bg-page"
        >
          <Box alignItems="center" gap="m" minWidth={0}>
            <Button
              variant="ghost"
              size="icon-s"
              radius="m"
              aria-label={isNavigationOpen === true ? "Hide navigation" : "Show navigation"}
              aria-pressed={isNavigationOpen}
              onClick={toggleNavigation}
            >
              <PanelLeft aria-hidden="true" size={16} />
            </Button>
            <Text as="h1" variant="title">
              {title}
            </Text>
            <SourceLink source={source} />
          </Box>
          <Box alignItems="center" gap="none">
            <Button
              variant="ghost"
              size="icon-s"
              radius="m"
              aria-label={
                previousComponent !== undefined
                  ? `Previous page: ${previousComponent.title}`
                  : "No previous page"
              }
              disabled={previousComponent === undefined}
              onClick={navigatePrevious}
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon-s"
              radius="m"
              aria-label={
                nextComponent !== undefined
                  ? `Next page: ${nextComponent.title}`
                  : "No next page"
              }
              disabled={nextComponent === undefined}
              onClick={navigateNext}
            >
              <ArrowRight aria-hidden="true" size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon-s"
              radius="m"
              aria-label={isControlsOpen === true ? "Hide controls" : "Show controls"}
              aria-pressed={isControlsOpen}
              onClick={toggleControls}
            >
              <PanelRight aria-hidden="true" size={16} />
            </Button>
          </Box>
        </Box>

        <Box
          flex={1}
          width="full"
          minWidth={0}
          minHeight={0}
          flexDirection="column"
          overflowX="hidden"
          overflowY="auto"
          data-scroll-area="main-content"
        >
          <Box
            as="section"
            role="region"
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
              borderColor="border"
              borderRadius="m"
              overflow="hidden"
              backgroundColor="bg-page"
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
              role="region"
              aria-label={`${title} documentation`}
              width="full"
              minWidth={0}
              flexDirection="column"
              paddingBottom="4xl"
            >
              <DocsPage>{children}</DocsPage>
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
          borderLeftWidth={1}
          borderStyle="solid"
          borderColor="border"
          backgroundColor="bg-page"
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
