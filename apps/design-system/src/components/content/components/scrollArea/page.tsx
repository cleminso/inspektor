import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { scrollAreaItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import BothAxesExample from './bothAxesExample'
import bothAxesSource from './bothAxesExample.tsx?raw'
import { scrollAreaPropNames } from './props'

const props = getGeneratedProps('scrollArea', scrollAreaPropNames)

export function ScrollAreaPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={scrollAreaItem.title}
      description={scrollAreaItem.description}
      source={scrollAreaItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Overlay geometry"
        description="The native viewport owns scrolling while separate overlay tracks avoid changing the content width when overflow appears. Constrain the parent height and keep content padding inside the viewport."
      />
      <Section
        title="Both axes"
        description="Use both axes for intrinsic-width content such as data tables."
      >
        <Example
          source={bothAxesSource}
          align="start"
        >
          <BothAxesExample />
        </Example>
      </Section>
      <Section title="Props">
        <PropsTable rows={props} />
      </Section>
    </ComponentDocsPage>
  )
}
