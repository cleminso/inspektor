import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { CalendarPlayground } from './playground'
import { calendarPropNames } from './props'

const calendarProps = getGeneratedProps('calendar', calendarPropNames)

export function CalendarPage(): ReactElement {
  return (
    <CalendarPlayground>
      <Section
        title="Date selection"
        description="Use Calendar as a standalone surface for controlled or uncontrolled date selection."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section title="Props">
        <PropsTable rows={calendarProps} />
      </Section>
    </CalendarPlayground>
  )
}
