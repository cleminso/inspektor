import { type ReactElement } from 'react'

import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import { WorkspaceTabsPlayground } from './playground'
import {
  workspaceTabsBarPropNames,
  workspaceTabsLeadingAreaPropNames,
  workspaceTabsListPropNames,
  workspaceTabsPanelPropNames,
  workspaceTabsRootPropNames,
  workspaceTabsTabPropNames,
  workspaceTabsTrailingAreaPropNames,
} from './props'

const rootProps = getGeneratedProps('workspaceTabs.root', workspaceTabsRootPropNames)
const barProps = getGeneratedProps('workspaceTabs.bar', workspaceTabsBarPropNames)
const leadingAreaProps = getGeneratedProps(
  'workspaceTabs.leadingArea',
  workspaceTabsLeadingAreaPropNames,
)
const listProps = getGeneratedProps('workspaceTabs.list', workspaceTabsListPropNames)
const tabProps = getGeneratedProps('workspaceTabs.tab', workspaceTabsTabPropNames)
const trailingAreaProps = getGeneratedProps(
  'workspaceTabs.trailingArea',
  workspaceTabsTrailingAreaPropNames,
)
const panelProps = getGeneratedProps('workspaceTabs.panel', workspaceTabsPanelPropNames)

export function WorkspaceTabsPage(): ReactElement {
  return (
    <WorkspaceTabsPlayground>
      <Section
        title="Behavior"
        description="Workspace Tabs composes fixed leading and trailing control areas around a horizontally scrollable tab list. Tabs retain their full title width, pass beneath the opaque fixed areas while scrolling, and reveal the selected tab at the nearest edge. A controlled value list and reorder callback enable horizontal pointer dragging; a successful drop activates the dragged tab, while a canceled drag preserves the active view. Tab moves sequentially through each tab and close action without activating a view; Enter opens reorder actions below the focused tab, arrow keys navigate between tabs, Shift plus Arrow reorders directly, and Delete closes the focused view. Closable items keep the complete title and close action mounted as sibling controls. Hover or keyboard focus reveals the close action over a trailing title fade without changing the tab width."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="List props">
        <PropsTable rows={listProps} />
      </Section>
      <Section title="Bar props">
        <PropsTable rows={barProps} />
      </Section>
      <Section title="Leading Area props">
        <PropsTable rows={leadingAreaProps} />
      </Section>
      <Section title="Tab props">
        <PropsTable rows={tabProps} />
      </Section>
      <Section title="Trailing Area props">
        <PropsTable rows={trailingAreaProps} />
      </Section>
      <Section title="Panel props">
        <PropsTable rows={panelProps} />
      </Section>
    </WorkspaceTabsPlayground>
  )
}
