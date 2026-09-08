import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { sidePanelItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function SidePanelPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={sidePanelItem.title}
      description={sidePanelItem.description}
      source={sidePanelItem.source}
      preview={
        <Box
          width="popup-width-m"
          height="panel-height"
        >
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    />
  )
}
