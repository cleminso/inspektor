import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { floatingPanelItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function FloatingPanelPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={floatingPanelItem.title}
      description={floatingPanelItem.description}
      source={floatingPanelItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
