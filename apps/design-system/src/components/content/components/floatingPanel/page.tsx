import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { floatingPanelItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function FloatingPanelPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={floatingPanelItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
