import { ButtonLink } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { getGeneratedProps } from '@/lib/propsData'
import { buttonLinkItem } from '@/lib/registry'

import { buttonLinkPropNames } from './props'
import RouterExample from './routerExample'
import routerSource from './routerExample.tsx?raw'
import VariantsExample from './variantsExample'
import variantsSource from './variantsExample.tsx?raw'

const buttonLinkProps = getGeneratedProps(buttonLinkItem.componentId, buttonLinkPropNames)

export function ButtonLinkPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={buttonLinkItem.title}
      description={buttonLinkItem.description}
      source={buttonLinkItem.source}
      preview={<ButtonLink href="#button-link-examples">Open documentation</ButtonLink>}
      sourceCode={createPlaygroundSource({
        imports: { ButtonLink: true },
        example: '<ButtonLink href="/docs">Open documentation</ButtonLink>',
      })}
    >
      <Section
        title="Variants"
        description="ButtonLink shares Button presentation while preserving navigation semantics."
      >
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>
      <Section
        title="Router composition"
        description="Use render when the application router owns the destination."
      >
        <Example source={routerSource}>
          <RouterExample />
        </Example>
      </Section>
      <Section title="ButtonLink props">
        <PropsTable rows={buttonLinkProps} />
      </Section>
    </ComponentDocsPage>
  )
}
