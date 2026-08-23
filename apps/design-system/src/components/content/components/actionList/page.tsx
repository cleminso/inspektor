import { Box } from '@inspector/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { actionListItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  actionListActionPropNames,
  actionListItemPropNames,
  actionListRootPropNames,
  actionListSelectionControlPropNames,
  actionListTriggerPropNames,
} from './props'

const rootProps = getGeneratedProps('actionList.root', actionListRootPropNames)
const itemProps = getGeneratedProps('actionList.item', actionListItemPropNames)
const selectionControlProps = getGeneratedProps(
  'actionList.selectionControl',
  actionListSelectionControlPropNames,
)
const triggerProps = getGeneratedProps('actionList.trigger', actionListTriggerPropNames)
const actionProps = getGeneratedProps('actionList.action', actionListActionPropNames)

export function ActionListPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={actionListItem.title}
      description={actionListItem.description}
      source={actionListItem.source}
      preview={
        <Box width="popup-width-m">
          <BasicExample />
        </Box>
      }
      sourceCode={basicSource}
    >
      <Section
        title="Selection and actions"
        description="SelectionControl keeps bulk selection separate from the primary trigger. Compose Menu.Trigger around ActionList.Action for trailing commands, or compose ContextMenu.Trigger onto ActionList.Item when the complete item should open a context menu."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Selection control props">
        <PropsTable rows={selectionControlProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Action props">
        <PropsTable rows={actionProps} />
      </Section>
    </ComponentDocsPage>
  )
}
