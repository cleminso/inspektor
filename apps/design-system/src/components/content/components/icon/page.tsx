import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { iconItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function IconPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={iconItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
