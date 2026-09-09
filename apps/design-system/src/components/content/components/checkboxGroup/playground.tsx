import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { checkboxGroupItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function CheckboxGroupPlayground(): ReactElement {
  return (
    <ComponentDocsPage
      item={checkboxGroupItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
