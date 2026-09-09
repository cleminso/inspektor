import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { treeItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function TreePage(): ReactElement {
  return (
    <ComponentDocsPage
      item={treeItem}
      preview={
        <Box
          width="popup-width-m"
          height="viewport-height-m"
        >
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    />
  )
}
