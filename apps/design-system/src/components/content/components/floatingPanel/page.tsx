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
  floatingPanelRootPropNames,
  floatingPanelSummaryPropNames,
} from './props'

const rootProps = getGeneratedProps('floatingPanel.root', floatingPanelRootPropNames)
const contentProps = getGeneratedProps('floatingPanel.content', floatingPanelContentPropNames)
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
      description="Compose one persistent non-modal controller from summary, content, and action parts. The panel is portalled for placement while interaction outside remains available; applications own disclosure controls in their surrounding layout."
      />
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Content props"><PropsTable rows={contentProps} /></Section>
      <Section title="Summary props"><PropsTable rows={summaryProps} /></Section>
      <Section title="Actions props"><PropsTable rows={actionsProps} /></Section>
    </ComponentDocsPage>
  )
}
