import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { themeSwitchItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function ThemeSwitchPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={themeSwitchItem}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
