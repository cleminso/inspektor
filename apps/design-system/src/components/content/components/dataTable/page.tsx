import { type ReactElement } from 'react'

import { Box } from '@inspector/ds'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { dataTableItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  dataTableCellPropNames,
  dataTableContentPropNames,
  dataTableExpandedRowPropNames,
  dataTableHeaderCellPropNames,
  dataTableHeaderRowPropNames,
  dataTablePartPropNames,
  dataTableRootPropNames,
  dataTableRowPropNames,
  dataTableTablePropNames,
} from './props'

const rootProps = getGeneratedProps('dataTable.root', dataTableRootPropNames)
const viewportProps = getGeneratedProps('dataTable.viewport', dataTablePartPropNames)
const tableProps = getGeneratedProps('dataTable.table', dataTableTablePropNames)
const contentProps = getGeneratedProps('dataTable.content', dataTableContentPropNames)
const headerProps = getGeneratedProps('dataTable.header', dataTablePartPropNames)
const headerRowProps = getGeneratedProps('dataTable.headerRow', dataTableHeaderRowPropNames)
const headerCellProps = getGeneratedProps('dataTable.headerCell', dataTableHeaderCellPropNames)
const bodyProps = getGeneratedProps('dataTable.body', dataTablePartPropNames)
const rowProps = getGeneratedProps('dataTable.row', dataTableRowPropNames)
const cellProps = getGeneratedProps('dataTable.cell', dataTableCellPropNames)
const expandedRowProps = getGeneratedProps('dataTable.expandedRow', dataTableExpandedRowPropNames)
const messageProps = getGeneratedProps('dataTable.empty', dataTablePartPropNames)
const footerProps = getGeneratedProps('dataTable.footer', dataTablePartPropNames)

export function DataTablePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={dataTableItem.title}
      description={dataTableItem.description}
      source={dataTableItem.source}
      preview={<Box width="full" height="panel-height"><BasicExample /></Box>}
      sourceCode={basicSource}
    >
      <Section
        title="Composition"
        description="Pass a controlled TanStack table to Root, use Content for standard rendering, or compose structural parts for expanded and specialized rows."
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
