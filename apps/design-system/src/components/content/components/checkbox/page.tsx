import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { checkboxItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { CheckboxPlayground } from './playground'
import { checkboxLabelPropNames, checkboxPropNames } from './props'
import StatesExample from './statesExample'
import statesSource from './statesExample.tsx?raw'

const checkboxProps = getGeneratedProps(checkboxItem.componentId, checkboxPropNames)
const checkboxLabelProps = getGeneratedProps('checkbox.label', checkboxLabelPropNames)

export function CheckboxPage(): ReactElement {
  return (
    <CheckboxPlayground>
      <Section
        title="Label"
        description="Use Checkbox.Label to provide an accessible name and complete hit area."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="States"
        description="Checkbox supports checked, mixed, checked-disabled, focus-visible, and size states."
      >
        <Example source={statesSource}>
          <StatesExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Checkbox participates in Field and native forms automatically."
      >
        <PropsTable rows={checkboxProps} />
      </Section>

      <Section
        title="Label props"
        description="Checkbox.Label makes the visible text and gap interactive."
      >
        <PropsTable rows={checkboxLabelProps} />
      </Section>
    </CheckboxPlayground>
  )
}
