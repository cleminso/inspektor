import { type ReactElement, type ReactNode } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { workspaceTabsItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function WorkspaceTabsPlayground({ children }: { children?: ReactNode }): ReactElement {
  return (
    <ComponentDocsPage
      title={workspaceTabsItem.title}
      description={workspaceTabsItem.description}
      source={workspaceTabsItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
      controls={null}
    >
      {children}
    </ComponentDocsPage>
  )
}
