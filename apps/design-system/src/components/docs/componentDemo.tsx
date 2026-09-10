import { Box, Button } from '@inspektor/ds'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type ReactElement, type ReactNode, useId, useState } from 'react'

import { CodeBlock } from '@/components/docs/codeBlock'

interface ComponentDemoProps {
  children: ReactNode
  source: string
}

export function ComponentDemo({ children, source }: ComponentDemoProps): ReactElement {
  const [isSourceVisible, setIsSourceVisible] = useState(false)
  const sourcePanelId = useId()

  return (
    <Box
      as="section"
      aria-label="Component example"
      width="full"
      minWidth={0}
      flexDirection="column"
      borderWidth={1}
      borderStyle="solid"
      borderColor="default"
      borderRadius="s"
      overflow="hidden"
    >
      <Box
        data-docs-component-preview
        width="full"
        minWidth={0}
        minHeight="example-height"
        alignItems="center"
        padding="2xl"
        overflowX="auto"
      >
        {children}
      </Box>
      <Box
        width="full"
        borderTopWidth={1}
        borderStyle="solid"
        borderColor="default"
      >
        <Button
          variant="ghost"
          layout="row"
          radius="none"
          prefix={<Button.Glyph artwork={isSourceVisible === true ? ChevronDown : ChevronRight} />}
          aria-controls={sourcePanelId}
          aria-expanded={isSourceVisible}
          onClick={() => setIsSourceVisible((isVisible) => isVisible === false)}
        >
          {isSourceVisible === true ? 'Hide code' : 'Show code'}
        </Button>
      </Box>
      <Box
        id={sourcePanelId}
        hidden={isSourceVisible === false}
        display={isSourceVisible === true ? 'flex' : 'none'}
        width="full"
      >
        {isSourceVisible === true ? <CodeBlock source={source} /> : null}
      </Box>
    </Box>
  )
}
