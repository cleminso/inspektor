import { Box } from '@inspektor/ds'
import { type ReactElement, type ReactNode } from 'react'

import { CodeBlock } from '@/components/docs/codeBlock'
import { DocsHeader } from '@/components/docs/docsHeader'
import { DocsPage } from '@/components/docs/docsPage'
import { navigationItems, type SourceReference } from '@/lib/registry'
import { AppShellDetails } from '@/layout/appShellDetails'

interface ComponentDocsPageProps {
  title: string
  description: string
  source: SourceReference
  preview: ReactNode
  sourceCode: string
  controls?: ReactNode
  children?: ReactNode
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
  const item = navigationItems.find((navigationItem) => navigationItem.source.path === source.path)

  if (item === undefined) {
    throw new Error(`No navigation item found for ${source.path}`)
  }

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
        backgroundColor="surface-background"
        borderRadius="xs"
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
      <AppShellDetails
        label={`${title} details`}
        description={description}
      >
        {controls}
      </AppShellDetails>
    </Box>
  )
}
