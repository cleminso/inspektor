import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { themeSwitchItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'

export function ThemeSwitchPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={themeSwitchItem.title}
      description={themeSwitchItem.description}
      source={themeSwitchItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    />
  )
}
