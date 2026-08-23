import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { timestampValueItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { timestampValuePropNames } from './props'

const timestampValueProps = getGeneratedProps(
  timestampValueItem.componentId,
  timestampValuePropNames,
)
export function TimestampValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={timestampValueItem.title}
      description={timestampValueItem.description}
      source={timestampValueItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Presentation"
        description="TimestampValue renders compact local date and time text while preserving the exact ISO instant for assistive technology and browser semantics. Invalid values render an explicit fallback."
      />
      <Section title="TimestampValue props">
        <PropsTable rows={timestampValueProps} />
      </Section>
    </ComponentDocsPage>
  )
}
