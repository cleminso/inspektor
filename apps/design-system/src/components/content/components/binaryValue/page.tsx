import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { binaryValueItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { binaryDetailsPropNames, binaryValuePropNames } from './props'

const binaryValueProps = getGeneratedProps(binaryValueItem.componentId, binaryValuePropNames)
const binaryDetailsProps = getGeneratedProps('binaryDetails', binaryDetailsPropNames)

export function BinaryValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={binaryValueItem.title}
      description={binaryValueItem.description}
      source={binaryValueItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Application-owned data"
        description="BinaryValue renders only a byte count. BinaryDetails owns the action menu and feedback while consumers own encoding, clipboard content, and download lifecycle through callbacks."
      />
      <Section title="BinaryValue props">
        <PropsTable rows={binaryValueProps} />
      </Section>
      <Section title="BinaryDetails props">
        <PropsTable rows={binaryDetailsProps} />
      </Section>
    </ComponentDocsPage>
  )
}
