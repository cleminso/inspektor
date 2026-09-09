import { ButtonLink } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { buttonLinkItem } from '@/lib/registry'

export function ButtonLinkPage(): ReactElement {
  return (
    <ComponentDocsPage
      item={buttonLinkItem}
      preview={<ButtonLink href="/components/button-link">Open documentation</ButtonLink>}
      sourceCode={createPlaygroundSource({
        imports: { ButtonLink: true },
        example: '<ButtonLink href="/components/button-link">Open documentation</ButtonLink>',
      })}
    />
  )
}
