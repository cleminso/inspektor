import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { structuredValuePreviewItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function StructuredValuePreviewPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={structuredValuePreviewItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
