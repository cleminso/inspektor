import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { workspaceTabsItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function WorkspaceTabsPlayground(): ReactElement {
  return (
    <ComponentDocsPage
      item={workspaceTabsItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
