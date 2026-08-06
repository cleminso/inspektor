import { type ReactElement } from 'react'

import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import { TabViewPlayground } from './playground'
import {
  tabViewItemPropNames,
  tabViewListPropNames,
  tabViewPanelPropNames,
  tabViewRootPropNames,
} from './props'

const rootProps = getGeneratedProps('tabView.root', tabViewRootPropNames)
const listProps = getGeneratedProps('tabView.list', tabViewListPropNames)
const itemProps = getGeneratedProps('tabView.item', tabViewItemPropNames)
const panelProps = getGeneratedProps('tabView.panel', tabViewPanelPropNames)

export function TabViewPage(): ReactElement {
  return (
    <TabViewPlayground>
      <Section
        title="Behavior"
        description="Views select on pointer interaction or arrow-key focus. A controlled value list and reorder callback enable horizontal pointer dragging while preserving touch scrolling. Every view name exposes supplementary tooltip context. The first tooltip observes the hover delay, while adjacent tooltip replacements open instantly without entrance motion. The close action appears for the active, hovered, or focused view and exposes a Close view tooltip. Press Delete while a tab is focused to close it. Sequential focus moves from the active tab into the panel content."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="List props">
        <PropsTable rows={listProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Panel props">
        <PropsTable rows={panelProps} />
      </Section>
    </TabViewPlayground>
  )
}
