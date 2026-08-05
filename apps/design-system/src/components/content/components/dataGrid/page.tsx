import { type ReactElement } from 'react'

import { Box } from '@inspector/ds'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { dataGridItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  dataGridCellPropNames,
  dataGridContentPropNames,
  dataGridExpandedRowPropNames,
  dataGridHeaderCellPropNames,
  dataGridHeaderRowPropNames,
  dataGridPartPropNames,
  dataGridRootPropNames,
  dataGridRowPropNames,
  dataGridTablePropNames,
} from './props'

const rootProps = getGeneratedProps('dataGrid.root', dataGridRootPropNames)
const viewportProps = getGeneratedProps('dataGrid.viewport', dataGridPartPropNames)
const tableProps = getGeneratedProps('dataGrid.table', dataGridTablePropNames)
const contentProps = getGeneratedProps('dataGrid.content', dataGridContentPropNames)
const headerProps = getGeneratedProps('dataGrid.header', dataGridPartPropNames)
const headerRowProps = getGeneratedProps('dataGrid.headerRow', dataGridHeaderRowPropNames)
const headerCellProps = getGeneratedProps('dataGrid.headerCell', dataGridHeaderCellPropNames)
const bodyProps = getGeneratedProps('dataGrid.body', dataGridPartPropNames)
const rowProps = getGeneratedProps('dataGrid.row', dataGridRowPropNames)
const cellProps = getGeneratedProps('dataGrid.cell', dataGridCellPropNames)
const expandedRowProps = getGeneratedProps('dataGrid.expandedRow', dataGridExpandedRowPropNames)
const messageProps = getGeneratedProps('dataGrid.empty', dataGridPartPropNames)
const footerProps = getGeneratedProps('dataGrid.footer', dataGridPartPropNames)

export function DataGridPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={dataGridItem.title}
      description={dataGridItem.description}
      source={dataGridItem.source}
      preview={<Box width="full" height="panel-height"><BasicExample /></Box>}
      sourceCode={basicSource}
    >
      <Section
        title="Composition"
        description="Pass a controlled TanStack table to Root, use Content for standard rendering, or compose structural parts for expanded and specialized rows. The native two-axis viewport keeps its vertical overlay track aligned with the body below the sticky header."
      />
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Viewport props"><PropsTable rows={viewportProps} /></Section>
      <Section title="Table props"><PropsTable rows={tableProps} /></Section>
      <Section title="Content props"><PropsTable rows={contentProps} /></Section>
      <Section title="Header props"><PropsTable rows={headerProps} /></Section>
      <Section title="Header row props"><PropsTable rows={headerRowProps} /></Section>
      <Section title="Header cell props"><PropsTable rows={headerCellProps} /></Section>
      <Section title="Body props"><PropsTable rows={bodyProps} /></Section>
      <Section title="Row props"><PropsTable rows={rowProps} /></Section>
      <Section title="Cell props"><PropsTable rows={cellProps} /></Section>
      <Section title="Expanded row props"><PropsTable rows={expandedRowProps} /></Section>
      <Section title="Empty and loading props"><PropsTable rows={messageProps} /></Section>
      <Section title="Footer props"><PropsTable rows={footerProps} /></Section>
    </ComponentDocsPage>
  )
}
