import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { alertDialogItem } from '@/lib/registry'

import DefaultExample from './defaultExample'
import defaultSource from './defaultExample.tsx?raw'

export function AlertDialogPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={alertDialogItem}
      preview={<DefaultExample />}
      sourceCode={defaultSource}
    />
  )
}
