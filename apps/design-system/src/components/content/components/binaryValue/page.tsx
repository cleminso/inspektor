import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { binaryValueItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function BinaryValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={binaryValueItem.title}
      description={binaryValueItem.description}
      source={binaryValueItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
