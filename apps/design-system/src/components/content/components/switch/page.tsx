import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { switchItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { SwitchPlayground } from './playground'
import { switchPropNames } from './props'
import StatesExample from './statesExample'
import statesSource from './statesExample.tsx?raw'

const switchProps = getGeneratedProps(switchItem.componentId, switchPropNames)

export function SwitchPage(): ReactElement {
  return (
    <SwitchPlayground>
      <Section
        title="Field"
        description="Use Field.Label to provide an accessible name and click target."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Sizes and states"
        description="Switch covers checked, disabled, read-only, hover, and pressed interaction states."
      >
        <Example source={statesSource}>
          <StatesExample />
        </Example>
      </Section>
      <Section
        title="Props"
        description="Switch participates in Field and native forms automatically."
      >
        <PropsTable rows={switchProps} />
      </Section>
    </SwitchPlayground>
  )
}
