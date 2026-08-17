import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { floatingPanelItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  floatingPanelActionsPropNames,
  floatingPanelContentPropNames,
  floatingPanelDetailsPropNames,
  floatingPanelRootPropNames,
  floatingPanelSummaryPropNames,
} from './props'

const rootProps = getGeneratedProps('floatingPanel.root', floatingPanelRootPropNames)
const contentProps = getGeneratedProps('floatingPanel.content', floatingPanelContentPropNames)
const detailsProps = getGeneratedProps('floatingPanel.details', floatingPanelDetailsPropNames)
const summaryProps = getGeneratedProps('floatingPanel.summary', floatingPanelSummaryPropNames)
const actionsProps = getGeneratedProps('floatingPanel.actions', floatingPanelActionsPropNames)

export function FloatingPanelPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={floatingPanelItem.title}
      description={floatingPanelItem.description}
      source={floatingPanelItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Composition"
        description="Compose one persistent non-modal controller from summary, details, content, and action parts. Content is compact by default and can expand for detailed review. Width contraction overlaps the detail height, transform, and opacity exit so the whole surface collapses continuously, while nested content changes remain immediate. The panel is portalled for placement while interaction outside remains available."
      />
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Content props"><PropsTable rows={contentProps} /></Section>
      <Section title="Details props"><PropsTable rows={detailsProps} /></Section>
      <Section title="Summary props"><PropsTable rows={summaryProps} /></Section>
      <Section title="Actions props"><PropsTable rows={actionsProps} /></Section>
    </ComponentDocsPage>
  )
}
