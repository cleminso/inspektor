import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { binaryValueItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function BinaryValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      item={binaryValueItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
