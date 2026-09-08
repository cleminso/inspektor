import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { boxItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function BoxPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={boxItem.title}
      description={boxItem.description}
      source={boxItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
