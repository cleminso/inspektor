import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { datePickerItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function DatePickerPlayground(): ReactElement {
  return (
    <ComponentDocsPage
      title={datePickerItem.title}
      description={datePickerItem.description}
      source={datePickerItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
