import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { treeItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  treeContentPropNames,
  treeItemPropNames,
  treeRootPropNames,
  treeSectionPropNames,
  treeTriggerPropNames,
} from './props'

const rootProps = getGeneratedProps('tree.root', treeRootPropNames)
const sectionProps = getGeneratedProps('tree.section', treeSectionPropNames)
const triggerProps = getGeneratedProps('tree.trigger', treeTriggerPropNames)
const contentProps = getGeneratedProps('tree.content', treeContentPropNames)
const itemProps = getGeneratedProps('tree.item', treeItemPropNames)

export function TreePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={treeItem.title}
      description={treeItem.description}
      source={treeItem.source}
      preview={
        <Box
          width="popup-width-m"
          height="viewport-height-m"
        >
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    >
      <Section
        title="Composition"
        description="Compose sections from a folder trigger and nested content. Items use native links or router link composition."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Section props">
        <PropsTable rows={sectionProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
    </ComponentDocsPage>
  )
}
