import { Box } from '@inspektor/ds'
import { type ReactElement, type ReactNode } from 'react'

import { CodeBlock } from '@/components/docs/codeBlock'
import { DocsHeader } from '@/components/docs/docsHeader'
import { navigationItems, type SourceReference } from '@/lib/registry'
import { AppShellDetails } from '@/layout/appShellDetails'

interface ComponentDocsPageProps {
  title: string
  description: string
  source: SourceReference
  preview: ReactNode
  sourceCode: string
  controls?: ReactNode
}

export function ComponentDocsPage({
  title,
  description,
  source,
  preview,
  sourceCode,
  controls,
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
      <DocsHeader
        item={item}
        description={description}
      />

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
        gap="xs"
      >
        <Box
          as="section"
          aria-label={`${title} playground`}
          width="full"
          minHeight="panel-height"
          minWidth={0}
          alignItems="center"
          justifyContent="center"
          padding="2xl"
          overflowX="hidden"
          backgroundColor="surface-background"
          borderRadius="xs"
        >
          {preview}
        </Box>

        <CodeBlock source={sourceCode} />
      </Box>
      {controls !== undefined ? (
        <AppShellDetails label={`${title} details`}>{controls}</AppShellDetails>
      ) : null}
    </Box>
  )
}
