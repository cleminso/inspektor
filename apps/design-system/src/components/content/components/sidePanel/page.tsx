import { Box } from '@inspector/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { sidePanelItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { sidePanelPartPropNames } from './props'

const rootProps = getGeneratedProps('sidePanel.root', sidePanelPartPropNames)
const headerProps = getGeneratedProps('sidePanel.header', sidePanelPartPropNames)
const bodyProps = getGeneratedProps('sidePanel.body', sidePanelPartPropNames)
const footerProps = getGeneratedProps('sidePanel.footer', sidePanelPartPropNames)

export function SidePanelPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={sidePanelItem.title}
      description={sidePanelItem.description}
      source={sidePanelItem.source}
      preview={
        <Box
          width="popup-width-m"
          height="panel-height"
        >
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    >
      <Section
        title="Composition"
        description="Compose feature controls inside the fixed header, scrolling body, and fixed footer regions."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Header props">
        <PropsTable rows={headerProps} />
      </Section>
      <Section title="Body props">
        <PropsTable rows={bodyProps} />
      </Section>
      <Section title="Footer props">
        <PropsTable rows={footerProps} />
      </Section>
    </ComponentDocsPage>
  )
}
