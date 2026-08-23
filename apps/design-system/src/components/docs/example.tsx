import { Box } from '@inspector/ds'
import { type ReactElement, type ReactNode } from 'react'

import { CodeBlock } from '@/components/docs/codeBlock'

type ExampleAlignment = 'start' | 'center' | 'stretch'

interface ExampleProps {
  children: ReactNode
  source: string
  align?: ExampleAlignment
}

const alignmentByValue = {
  start: 'start',
  center: 'center',
  stretch: 'stretch',
} as const

export function Example({ children, source, align = 'center' }: ExampleProps): ReactElement {
  return (
    <Box
      flexDirection="column"
      borderWidth={1}
      borderStyle="solid"
      borderColor="default"
      borderRadius="s"
      overflow="hidden"
      backgroundColor="surface-background"
    >
      <Box
        minHeight="example-height"
        padding="2xl"
        flexDirection="row"
        flexWrap="wrap"
        alignItems={alignmentByValue[align]}
        justifyContent={align === 'center' ? 'center' : 'start'}
        gap="l"
      >
        {children}
      </Box>
      <CodeBlock source={source} />
    </Box>
  )
}
