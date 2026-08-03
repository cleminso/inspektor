import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { boxItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { boxPropNames } from './props'

const boxProps = getGeneratedProps(boxItem.componentId, boxPropNames)

export function BoxPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={boxItem.title}
      description={boxItem.description}
      source={boxItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Layout contract"
        description="Use semantic tokens and constrained layout props instead of class names or inline styles."
      />
      <Section title="Props">
        <PropsTable rows={boxProps} />
      </Section>
    </ComponentDocsPage>
  )
}
