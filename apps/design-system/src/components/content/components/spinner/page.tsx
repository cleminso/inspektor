import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { SpinnerPlayground } from './playground'
import { spinnerPropNames } from './props'

const spinnerProps = getGeneratedProps('spinner', spinnerPropNames)

export function SpinnerPage(): ReactElement {
  return (
    <SpinnerPlayground>
      <Section
        title="Loading status"
        description="Provide a label when the spinner is the only indication that work is in progress."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section title="Spinner props">
        <PropsTable rows={spinnerProps} />
      </Section>
    </SpinnerPlayground>
  )
}
