import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { shellLayoutItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function ShellLayoutPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={shellLayoutItem}
      preview={
        <Box
          width="full"
          height="panel-height"
        >
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    />
  )
}
