import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { MultiSelectPlayground } from './playground'
import {
  multiSelectContentPropNames,
  multiSelectRootPropNames,
  multiSelectTriggerPropNames,
} from './props'

const rootProps = getGeneratedProps('multiSelect.root', multiSelectRootPropNames)
const triggerProps = getGeneratedProps('multiSelect.trigger', multiSelectTriggerPropNames)
const contentProps = getGeneratedProps('multiSelect.content', multiSelectContentPropNames)

export function MultiSelectPage(): ReactElement {
  return (
    <MultiSelectPlayground>
      <Section
        title="Controlled selection"
        description="Keep selected values controlled when they synchronize with application state. Checkboxes remain open for repeated changes, while row actions expose Check all and Only shortcuts."
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
        description="The popup receives initial focus. Down enters the first row action and Up enters the last. Within the list, Up and Down preserve the focused column while Left and Right switch between the action and checkbox. Enter or Space activates the focused control, while Escape closes the popup and restores trigger focus."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
    </MultiSelectPlayground>
  )
}
