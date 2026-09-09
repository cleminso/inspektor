import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { badgeItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function BadgePage(): ReactElement {
  return (
    <ComponentDocsPage
      item={badgeItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
