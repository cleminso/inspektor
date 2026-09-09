import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { dataGridFilterClauseItem } from '@/lib/registry'

import CreateExample from './createExample'
import createSource from './createExample.tsx?raw'

export function DataGridFilterClausePage(): ReactElement {
  return (
    <ComponentDocsPage
      item={dataGridFilterClauseItem}
      preview={<CreateExample />}
      sourceCode={createSource}
    />
  )
}
