import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { swimlaneTimelineItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function SwimlaneTimelinePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={swimlaneTimelineItem.title}
      description={swimlaneTimelineItem.description}
      source={swimlaneTimelineItem.source}
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
