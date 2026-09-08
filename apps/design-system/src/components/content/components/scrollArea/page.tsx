import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { scrollAreaItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function ScrollAreaPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={scrollAreaItem.title}
      description={scrollAreaItem.description}
      source={scrollAreaItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
