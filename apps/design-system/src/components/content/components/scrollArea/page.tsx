import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { scrollAreaItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function ScrollAreaPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={scrollAreaItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
