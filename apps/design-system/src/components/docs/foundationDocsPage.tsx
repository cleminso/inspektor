import { Box } from '@inspektor/ds'
import { type ReactElement, type ReactNode } from 'react'

import { DocsHeader } from '@/components/docs/docsHeader'
import { DocsPage } from '@/components/docs/docsPage'
import { type NavItem } from '@/lib/registry'
import { AppShellDetails } from '@/layout/appShellDetails'

interface FoundationDocsPageProps {
  item: NavItem
  children: ReactNode
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
        backgroundColor="surface-background"
        borderRadius="xs"
      >
        <DocsPage>{children}</DocsPage>
      </Box>
      <AppShellDetails
        label={`${item.title} details`}
        description={item.description}
      />
    </Box>
  )
}
