import { type ReactElement, type ReactNode } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { tabViewItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function TabViewPlayground({ children }: { children?: ReactNode }): ReactElement {
  return (
    <ComponentDocsPage
      title={tabViewItem.title}
      description={tabViewItem.description}
      source={tabViewItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
      controls={null}
    >
      {children}
    </ComponentDocsPage>
  )
}
