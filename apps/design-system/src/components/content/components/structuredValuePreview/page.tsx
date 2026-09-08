import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { structuredValuePreviewItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function StructuredValuePreviewPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={structuredValuePreviewItem.title}
      description={structuredValuePreviewItem.description}
      source={structuredValuePreviewItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
