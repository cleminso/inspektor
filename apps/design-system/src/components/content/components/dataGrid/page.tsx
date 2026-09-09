import { type ReactElement } from 'react'

import { Box } from '@inspektor/ds'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { dataGridItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function DataGridPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={dataGridItem}
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
