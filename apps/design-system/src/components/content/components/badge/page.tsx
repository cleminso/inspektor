import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { badgePropNames } from './props'

const props = getGeneratedProps('badge', badgePropNames)

export function BadgePage(): ReactElement {
  return (
    <>
      <Section
        title="Text badge"
        description="Use a badge for short, non-interactive status or category text."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section title="Props">
        <PropsTable rows={props} />
      </Section>
    </>
  )
}
