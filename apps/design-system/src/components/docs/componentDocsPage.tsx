import { Box, ScrollArea } from '@inspektor/ds'
import { type ReactElement, type ReactNode } from 'react'

import { CodeBlock } from '@/components/docs/codeBlock'
import { DocsHeader } from '@/components/docs/docsHeader'
import { type NavItem } from '@/lib/registry'
import { AppShellDetails } from '@/layout/appShellDetails'

interface ComponentDocsPageProps {
  item: NavItem
  preview: ReactNode
  sourceCode: string
  controls?: ReactNode
}

export function ComponentDocsPage({
  item,
  preview,
  sourceCode,
  controls,
}: ComponentDocsPageProps): ReactElement {
  return (
    <Box
      width="full"
      height="full"
      minWidth={0}
      minHeight={0}
      flexDirection="column"
      overflow="hidden"
      backgroundColor="surface-background"
      borderRadius="xs"
    >
      <ScrollArea
        data-scroll-area="main-content"
        data-scroll-fade="top"
      >
        <DocsHeader item={item} />
        <Box
          as="section"
          aria-label={`${item.title} playground`}
          width="full"
          minWidth={0}
          flexDirection="column"
          overflowX="hidden"
        >
          <Box
            width="full"
            minWidth={0}
            minHeight="panel-height"
            alignItems="center"
            justifyContent="center"
            padding="2xl"
            overflowX="hidden"
          >
            {preview}
          </Box>
          <CodeBlock source={sourceCode} />
        </Box>
      </ScrollArea>
      {controls !== undefined ? (
        <AppShellDetails label={`${item.title} details`}>{controls}</AppShellDetails>
      ) : null}
    </Box>
  )
}
