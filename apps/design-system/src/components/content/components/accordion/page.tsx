import { Box } from '@inspector/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { accordionItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  accordionItemPropNames,
  accordionPanelPropNames,
  accordionRootPropNames,
  accordionTriggerPropNames,
} from './props'

const rootProps = getGeneratedProps('accordion.root', accordionRootPropNames)
const itemProps = getGeneratedProps('accordion.item', accordionItemPropNames)
const triggerProps = getGeneratedProps('accordion.trigger', accordionTriggerPropNames)
const panelProps = getGeneratedProps('accordion.panel', accordionPanelPropNames)

export function AccordionPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={accordionItem.title}
      description={accordionItem.description}
      source={accordionItem.source}
      preview={<Box width="popup-width-m"><BasicExample /></Box>}
      sourceCode={basicSource}
    >
      <Section title="Composition" description="Use one item for each related collapsible section." />
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Item props"><PropsTable rows={itemProps} /></Section>
      <Section title="Trigger props"><PropsTable rows={triggerProps} /></Section>
      <Section title="Panel props"><PropsTable rows={panelProps} /></Section>
    </ComponentDocsPage>
  )
}
