import { Box } from '@inspektor/ds'
import { type ReactElement, type ReactNode } from 'react'

interface DocsPageProps {
  children: ReactNode
  width?: 'content' | 'full'
}

export function DocsPage({ children, width = 'content' }: DocsPageProps): ReactElement {
  return (
    <Box
      display="block"
      width="full"
      marginHorizontal="auto"
      maxWidth={
        width === 'content' ? { base: 'content-width', xl: 'content-width-wide' } : undefined
      }
      data-docs-width={width}
    >
      <Box
        flexDirection="column"
        gap="4xl"
        padding="xl"
      >
        {children}
      </Box>
    </Box>
  )
}
