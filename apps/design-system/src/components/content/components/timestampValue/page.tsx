import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { timestampValueItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function TimestampValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      item={timestampValueItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
