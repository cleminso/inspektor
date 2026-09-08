import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { calendarItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function CalendarPlayground(): ReactElement {
  return (
    <ComponentDocsPage
      title={calendarItem.title}
      description={calendarItem.description}
      source={calendarItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
