import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import ControlledExample from './controlledExample'
import controlledSource from './controlledExample.tsx?raw'
import DisabledExample from './disabledExample'
import disabledSource from './disabledExample.tsx?raw'
import {
  comboboxClearPropNames,
  comboboxContentPropNames,
  comboboxIndicatorPropNames,
  comboboxInputTriggerPropNames,
  comboboxItemPropNames,
  comboboxPopupFooterPropNames,
  comboboxPopupHeaderPropNames,
  comboboxPopupPropNames,
  comboboxPositionerPropNames,
  comboboxRootPropNames,
  comboboxTriggerPropNames,
  comboboxViewportPropNames,
} from './props'
import { ComboboxPlayground } from './playground'
import SizesExample from './sizesExample'
import sizesSource from './sizesExample.tsx?raw'
import StatusExample from './statusExample'
import statusSource from './statusExample.tsx?raw'
import TriggerExample from './triggerExample'
import triggerSource from './triggerExample.tsx?raw'

const rootProps = getGeneratedProps('combobox.root', comboboxRootPropNames)
const contentProps = getGeneratedProps('combobox.content', comboboxContentPropNames)
const clearProps = getGeneratedProps('combobox.clear', comboboxClearPropNames)
const triggerProps = getGeneratedProps('combobox.trigger', comboboxTriggerPropNames)
const inputTriggerProps = getGeneratedProps('combobox.inputTrigger', comboboxInputTriggerPropNames)
const positionerProps = getGeneratedProps('combobox.positioner', comboboxPositionerPropNames)
const popupProps = getGeneratedProps('combobox.popup', comboboxPopupPropNames)
const popupHeaderProps = getGeneratedProps('combobox.popupHeader', comboboxPopupHeaderPropNames)
const popupFooterProps = getGeneratedProps('combobox.popupFooter', comboboxPopupFooterPropNames)
const viewportProps = getGeneratedProps('combobox.viewport', comboboxViewportPropNames)
const itemProps = getGeneratedProps('combobox.item', comboboxItemPropNames)
const indicatorProps = getGeneratedProps('combobox.itemIndicator', comboboxIndicatorPropNames)

export function ComboboxPage(): ReactElement {
  return (
    <ComboboxPlayground>
      <Section
        title="Uncontrolled default"
        description="Use Combobox as a text input with a filterable collection and an initial selection."
      >
        <Example
          source={basicSource}
          align="stretch"
        >
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Controlled object values"
        description="Provide identity and string conversion functions when options are objects."
      >
        <Example
          source={controlledSource}
          align="stretch"
        >
          <ControlledExample />
        </Example>
      </Section>
      <Section
        title="Sizes"
        description="Choose a constrained popup width while keeping the text input as the control."
      >
        <Example
          source={sizesSource}
          align="start"
        >
          <SizesExample />
        </Example>
      </Section>
      <Section
        title="Trigger sizing"
        description="Combobox.Trigger defaults to the medium control height. Use its size prop when a different constrained control height is required."
      >
        <Example
          source={triggerSource}
          align="start"
        >
          <TriggerExample />
        </Example>
      </Section>
      <Section
        title="Disabled"
        description="Disable the root to make the input and its actions unavailable together."
      >
        <Example
          source={disabledSource}
          align="start"
        >
          <DisabledExample />
        </Example>
      </Section>
      <Section
        title="Empty and loading status"
        description="Compose Empty and Status for result and asynchronous states."
      >
        <Example
          source={statusSource}
          align="start"
        >
          <StatusExample />
        </Example>
      </Section>
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section title="Clear props">
        <PropsTable rows={clearProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Input trigger props">
        <PropsTable rows={inputTriggerProps} />
      </Section>
      <Section title="Positioner props">
        <PropsTable rows={positionerProps} />
      </Section>
      <Section title="Popup props">
        <PropsTable rows={popupProps} />
      </Section>
      <Section title="Popup header props">
        <PropsTable rows={popupHeaderProps} />
      </Section>
      <Section title="Popup footer props">
        <PropsTable rows={popupFooterProps} />
      </Section>
      <Section title="Viewport props">
        <PropsTable rows={viewportProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Item indicator props">
        <PropsTable rows={indicatorProps} />
      </Section>
    </ComboboxPlayground>
  )
}
