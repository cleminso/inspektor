import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { relationValueItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function RelationValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      item={relationValueItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
