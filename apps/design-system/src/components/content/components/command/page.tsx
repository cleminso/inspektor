import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { commandItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function CommandPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={commandItem.title}
      description={commandItem.description}
      source={commandItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
