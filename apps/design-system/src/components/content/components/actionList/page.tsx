import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { actionListItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function ActionListPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={actionListItem.title}
      description={actionListItem.description}
      source={actionListItem.source}
      preview={
        <Box width="popup-width-m">
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    />
  )
}
