import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { multiSelectItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function MultiSelectPlayground(): ReactElement {
  return (
    <ComponentDocsPage
      title={multiSelectItem.title}
      description={multiSelectItem.description}
      source={multiSelectItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
