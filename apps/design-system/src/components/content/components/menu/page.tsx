import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import ChevronExample from './chevronExample'
import chevronSource from './chevronExample.tsx?raw'
import DefaultExample from './defaultExample'
import defaultSource from './defaultExample.tsx?raw'
import DisabledItemsExample from './disabledItemsExample'
import disabledItemsSource from './disabledItemsExample.tsx?raw'
import LinkItemsExample from './linkItemsExample'
import linkItemsSource from './linkItemsExample.tsx?raw'
import PrefixSuffixExample from './prefixSuffixExample'
import prefixSuffixSource from './prefixSuffixExample.tsx?raw'
import { MenuPlayground } from './playground'
import {
  menuCheckboxItemPropNames,
  menuContentPropNames,
  menuItemPropNames,
  menuLinkItemPropNames,
  menuPositionerPropNames,
  menuRadioItemPropNames,
  menuRootPropNames,
  menuShortcutPropNames,
  menuTriggerPropNames,
} from './props'
import SelectionItemsExample from './selectionItemsExample'
import selectionItemsSource from './selectionItemsExample.tsx?raw'

const rootProps = getGeneratedProps('menu.root', menuRootPropNames)
const triggerProps = getGeneratedProps('menu.trigger', menuTriggerPropNames)
const contentProps = getGeneratedProps('menu.content', menuContentPropNames)
const positionerProps = getGeneratedProps('menu.positioner', menuPositionerPropNames)
const itemProps = getGeneratedProps('menu.item', menuItemPropNames)
const linkItemProps = getGeneratedProps('menu.linkItem', menuLinkItemPropNames)
const shortcutProps = getGeneratedProps('menu.shortcut', menuShortcutPropNames)
const checkboxItemProps = getGeneratedProps('menu.checkboxItem', menuCheckboxItemPropNames)
const radioItemProps = getGeneratedProps('menu.radioItem', menuRadioItemPropNames)

export function MenuPage(): ReactElement {
  return (
    <MenuPlayground>
      <Section
        title="Default"
        description="Menu composes Button as its trigger while preserving Button's visual treatment."
      >
        <Example source={defaultSource}>
          <DefaultExample />
        </Example>
      </Section>
      <Section
        title="With chevron"
        description="Add a chevron when the trigger needs an affordance for the popup."
      >
        <Example source={chevronSource}>
          <ChevronExample />
        </Example>
      </Section>
      <Section
        title="Disabled items"
        description="Keep unavailable actions visible when their context is useful."
      >
        <Example source={disabledItemsSource}>
          <DisabledItemsExample />
        </Example>
      </Section>
      <Section
        title="Link items"
        description="Use LinkItem for navigation and Item for application actions."
      >
        <Example source={linkItemsSource}>
          <LinkItemsExample />
        </Example>
      </Section>
      <Section
        title="Prefix and suffix"
        description="Use prefixes for recognition and suffixes for keyboard hints or metadata."
      >
        <Example source={prefixSuffixSource}>
          <PrefixSuffixExample />
        </Example>
      </Section>
      <Section
        title="Selection items"
        description="Checkbox items represent independent settings. Radio items choose one value from a group."
      >
        <Example source={selectionItemsSource}>
          <SelectionItemsExample />
        </Example>
      </Section>
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section
        title="Positioner props"
        description="Use Positioner when composing the popup layers directly instead of using Content."
      >
        <PropsTable rows={positionerProps} />
      </Section>
      <Section
        title="Item props"
        description="Use the danger variant for destructive or difficult-to-reverse actions."
      >
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Link item props">
        <PropsTable rows={linkItemProps} />
      </Section>
      <Section title="Shortcut props">
        <PropsTable rows={shortcutProps} />
      </Section>
      <Section title="Checkbox item props">
        <PropsTable rows={checkboxItemProps} />
      </Section>
      <Section title="Radio item props">
        <PropsTable rows={radioItemProps} />
      </Section>
    </MenuPlayground>
  )
}
