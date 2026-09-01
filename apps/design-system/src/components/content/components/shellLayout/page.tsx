import { Box } from '@inspector/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { shellLayoutItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { shellLayoutRegionPropNames, shellLayoutRootPropNames } from './props'

const rootProps = getGeneratedProps('shellLayout.root', shellLayoutRootPropNames)
const regionProps = getGeneratedProps('shellLayout.header', shellLayoutRegionPropNames)

export function ShellLayoutPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={shellLayoutItem.title}
      description={shellLayoutItem.description}
      source={shellLayoutItem.source}
      preview={
        <Box
          width="full"
          height="panel-height"
        >
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    >
      <Section
        title="Composition"
        description="Compose a required flexible view with optional resizable left and right docks. Root keeps dock controls available to header and footer content, while the consumer owns persistence storage and product behavior."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Region props">
        <PropsTable rows={regionProps} />
      </Section>
    </ComponentDocsPage>
  )
}
