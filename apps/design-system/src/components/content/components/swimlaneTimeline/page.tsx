import { Box } from '@inspektor/ds'
import { type ReactElement } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { swimlaneTimelineItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import {
  swimlaneTimelineCellPropNames,
  swimlaneTimelineHeaderPropNames,
  swimlaneTimelineLanePropNames,
  swimlaneTimelineLaneTriggerPropNames,
  swimlaneTimelineRootPropNames,
  swimlaneTimelineTrackPropNames,
} from './props'

const rootProps = getGeneratedProps('swimlaneTimeline.root', swimlaneTimelineRootPropNames)
const headerProps = getGeneratedProps('swimlaneTimeline.header', swimlaneTimelineHeaderPropNames)
const laneProps = getGeneratedProps('swimlaneTimeline.lane', swimlaneTimelineLanePropNames)
const laneTriggerProps = getGeneratedProps(
  'swimlaneTimeline.laneTrigger',
  swimlaneTimelineLaneTriggerPropNames,
)
const trackProps = getGeneratedProps('swimlaneTimeline.track', swimlaneTimelineTrackPropNames)
const cellProps = getGeneratedProps('swimlaneTimeline.cell', swimlaneTimelineCellPropNames)

export function SwimlaneTimelinePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={swimlaneTimelineItem.title}
      description={swimlaneTimelineItem.description}
      source={swimlaneTimelineItem.source}
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
        description="Compose snapshot headings, lanes, tracks, and cells in one native table. Each track must contain one cell for every snapshot heading. Track labels remain opaque strings: the component shortens their visual presentation while preserving the complete value for assistive technology and the native tooltip. Lane expansion changes presentation only; data collection remains outside the component."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Header props">
        <PropsTable rows={headerProps} />
      </Section>
      <Section title="Lane props">
        <PropsTable rows={laneProps} />
      </Section>
      <Section title="Lane trigger props">
        <PropsTable rows={laneTriggerProps} />
      </Section>
      <Section title="Track props">
        <PropsTable rows={trackProps} />
      </Section>
      <Section title="Cell props">
        <PropsTable rows={cellProps} />
      </Section>
    </ComponentDocsPage>
  )
}
