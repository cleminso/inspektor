import { TextLink } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { textLinkItem } from '@/lib/registry'

export function TextLinkPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={textLinkItem}
      preview={<TextLink href="/components/text-link">Read documentation</TextLink>}
      sourceCode={createPlaygroundSource({
        imports: { TextLink: true },
        example: '<TextLink href="/components/text-link">Read documentation</TextLink>',
      })}
    />
  )
}
