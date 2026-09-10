import { Box, ScrollArea, Text } from '@inspektor/ds'
import { MDXProvider } from '@mdx-js/react'
import { type ReactElement, type ReactNode } from 'react'

import { mdxComponents } from '@/components/docs/mdxComponents'
import { type DocsItem } from '@/lib/registry'

interface ComponentPageProps {
  children: ReactNode
  item: DocsItem
}

export function ComponentPage({ children, item }: ComponentPageProps): ReactElement {
  return (
    <ScrollArea data-scroll-area="main-content">
      <Box
        flexGrow={1}
        width="full"
        maxWidth="content-width"
        marginHorizontal="auto"
        flexDirection="column"
        gap="xs"
      >
        <Box
          as="header"
          flexDirection="column"
          gap="s"
          paddingHorizontal="4xl"
          paddingVertical="2xl"
          borderRadius="xs"
          backgroundColor="surface-background"
        >
          <Text
            as="h1"
            variant="heading"
          >
            {item.title}
          </Text>
          <Text
            variant="body"
            color="muted"
          >
            {item.description}
          </Text>
        </Box>
        <Box
          flexGrow={1}
          flexDirection="column"
          gap="m"
          paddingHorizontal="4xl"
          paddingVertical="2xl"
          borderRadius="xs"
          backgroundColor="surface-background"
        >
          <MDXProvider components={mdxComponents}>{children}</MDXProvider>
        </Box>
      </Box>
    </ScrollArea>
  )
}
