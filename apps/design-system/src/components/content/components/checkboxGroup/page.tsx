import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { CheckboxGroupPlayground } from './playground'
import { checkboxGroupListPropNames, checkboxGroupRootPropNames } from './props'

const rootProps = getGeneratedProps('checkboxGroup.root', checkboxGroupRootPropNames)
const listProps = getGeneratedProps('checkboxGroup.list', checkboxGroupListPropNames)

export function CheckboxGroupPage(): ReactElement {
  return (
    <CheckboxGroupPlayground>
      <Section
        title="Controlled selection"
        description="Checkbox Group owns checkbox toggling, contextual Check all and Only actions, disabled-item preservation, and row keyboard navigation."
      >
        <Example
          source={basicSource}
          align="start"
        >
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Keyboard behavior"
        description="Up and Down move between rows while preserving the checkbox or action column. Home and End move to the collection edges, while Left and Right switch columns."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="List props">
        <PropsTable rows={listProps} />
      </Section>
    </CheckboxGroupPlayground>
  )
}
