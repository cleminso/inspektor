import * as stylex from '@stylexjs/stylex'
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import { spatial } from '../../tokens/semantics.stylex'
import { dimensions } from '../../tokens/value.stylex'
import { ChevronRightGlyph } from '../icon/iconArtwork'
import { ScrollArea } from '../scrollArea/scrollArea'
import { swimlaneTimelineStyles } from './swimlaneTimeline.styles'

export interface SwimlaneTimelineRootProps {
  /** Accessible name for the timeline table. */
  'aria-label': string
  /** Timeline header and composed lanes. */
  children: ReactNode
}

export interface SwimlaneTimelineHeaderProps {
  /** Heading for the fixed label column. */
  label: ReactNode
  /** Snapshot headings in chronological order. */
  children: ReactNode
}

export interface SwimlaneTimelineLaneProps {
  /** Whether the lane is expanded when uncontrolled. */
  defaultExpanded?: boolean
  /** Controlled lane expansion state. */
  expanded?: boolean
  /** Runs when the lane expansion state changes. */
  onExpandedChange?: (expanded: boolean) => void
  /** One lane trigger followed by its tracks. */
  children: ReactNode
}

export interface SwimlaneTimelineLaneTriggerProps {
  /** Lane heading. */
  children: ReactNode
  /** Optional metadata aligned opposite the heading. */
  suffix?: ReactNode
}

export interface SwimlaneTimelineTrackProps {
  /** Complete opaque identifier used for the accessible name and tooltip. */
  label: string
  /** One cell for every snapshot heading. */
  children: ReactNode
}

export type SwimlaneTimelineCellStatus = 'active' | 'inactive' | 'unknown'

interface SwimlaneTimelineCellBaseProps {
  /** Accessible description of this snapshot cell. */
  label: string
}

interface SwimlaneTimelineActiveCellProps extends SwimlaneTimelineCellBaseProps {
  /** Marks a snapshot containing activity. */
  status: 'active'
  /** Marks this active snapshot as selected. */
  selected?: boolean
  /** Runs when the active snapshot is activated. */
  onActivate: () => void
}

interface SwimlaneTimelinePassiveCellProps extends SwimlaneTimelineCellBaseProps {
  /** Marks a snapshot as inactive or unavailable. */
  status: 'inactive' | 'unknown'
  onActivate?: never
  selected?: never
}

export type SwimlaneTimelineCellProps =
  | SwimlaneTimelineActiveCellProps
  | SwimlaneTimelinePassiveCellProps

interface LaneContextValue {
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}

const TimelineContext = createContext<number | null>(null)
const LaneContext = createContext<LaneContextValue | null>(null)

function useLaneContext(): LaneContextValue {
  const context = useContext(LaneContext)
  if (context === null) {
    throw new Error('SwimlaneTimeline lane parts must be rendered inside SwimlaneTimeline.Lane')
  }
  return context
}

const SwimlaneTimelineRoot = forwardRef<HTMLTableElement, SwimlaneTimelineRootProps>(
  function SwimlaneTimelineRoot({ 'aria-label': ariaLabel, children }, forwardedRef) {
    const header = Children.toArray(children).find(
      (child) => isValidElement(child) && child.type === SwimlaneTimelineHeader,
    )
    const snapshotCount =
      header !== undefined && isValidElement<SwimlaneTimelineHeaderProps>(header)
        ? Children.toArray(header.props.children).length
        : 0
    const timelineWidth = `calc(${spatial['grid-track-m']} + ${snapshotCount} * ${dimensions[100]})`

    return (
      <TimelineContext.Provider value={snapshotCount}>
        <ScrollArea axis="both">
          <div
            {...stylex.props(swimlaneTimelineStyles.scrollSurface)}
            data-slot="swimlane-timeline-scroll-surface"
            style={{ width: timelineWidth }}
          >
            <table
              {...stylex.props(swimlaneTimelineStyles.table)}
              aria-label={ariaLabel}
              data-slot="swimlane-timeline"
              ref={forwardedRef}
            >
              {children}
            </table>
          </div>
        </ScrollArea>
      </TimelineContext.Provider>
    )
  },
)

function SwimlaneTimelineHeader({ children, label }: SwimlaneTimelineHeaderProps) {
  const headings = Children.toArray(children)
  return (
    <>
      <colgroup>
        <col {...stylex.props(swimlaneTimelineStyles.labelColumn)} />
        {headings.map((_, index) => (
          <col
            key={index}
            {...stylex.props(swimlaneTimelineStyles.snapshotColumn)}
          />
        ))}
        <col />
      </colgroup>
      <thead
        {...stylex.props(swimlaneTimelineStyles.header)}
        data-slot="swimlane-timeline-header"
      >
        <tr>
          <th
            {...stylex.props(
              swimlaneTimelineStyles.bodyCell,
              swimlaneTimelineStyles.headerCell,
              swimlaneTimelineStyles.labelHeaderCell,
            )}
            scope="col"
          >
            {label}
          </th>
          {Children.map(headings, (heading) => (
            <th
              {...stylex.props(swimlaneTimelineStyles.bodyCell, swimlaneTimelineStyles.headerCell)}
              scope="col"
            >
              {heading}
            </th>
          ))}
          <th
            {...stylex.props(swimlaneTimelineStyles.bodyCell, swimlaneTimelineStyles.headerCell)}
            aria-hidden="true"
          />
        </tr>
      </thead>
    </>
  )
}

const SwimlaneTimelineLane = forwardRef<HTMLTableSectionElement, SwimlaneTimelineLaneProps>(
  function SwimlaneTimelineLane(
    { children, defaultExpanded = true, expanded: controlledExpanded, onExpandedChange },
    forwardedRef,
  ) {
    const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded)
    const expanded = controlledExpanded ?? uncontrolledExpanded
    const setExpanded = (nextExpanded: boolean) => {
      if (controlledExpanded === undefined) {
        setUncontrolledExpanded(nextExpanded)
      }
      onExpandedChange?.(nextExpanded)
    }

    return (
      <LaneContext.Provider value={{ expanded, setExpanded }}>
        <tbody
          data-expanded={expanded === true ? 'true' : 'false'}
          data-slot="swimlane-timeline-lane"
          ref={forwardedRef}
        >
          {children}
        </tbody>
      </LaneContext.Provider>
    )
  },
)

function SwimlaneTimelineLaneTrigger({ children, suffix }: SwimlaneTimelineLaneTriggerProps) {
  const { expanded, setExpanded } = useLaneContext()
  const snapshotCount = useContext(TimelineContext)
  if (snapshotCount === null) {
    throw new Error('SwimlaneTimeline parts must be rendered inside SwimlaneTimeline')
  }
  return (
    <tr
      {...stylex.props(swimlaneTimelineStyles.laneHeadingRow)}
      data-slot="swimlane-timeline-lane-heading"
    >
      <th
        {...stylex.props(swimlaneTimelineStyles.bodyCell, swimlaneTimelineStyles.laneHeadingCell)}
        scope="rowgroup"
      >
        <button
          {...stylex.props(swimlaneTimelineStyles.laneTrigger)}
          aria-expanded={expanded}
          type="button"
          onClick={() => setExpanded(!expanded)}
        >
          <span {...stylex.props(swimlaneTimelineStyles.laneTriggerLeading)}>
            <span {...stylex.props(swimlaneTimelineStyles.laneLabel)}>{children}</span>
            <ChevronRightGlyph
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              {...stylex.props(
                swimlaneTimelineStyles.laneIndicator,
                expanded === true && swimlaneTimelineStyles.laneIndicatorExpanded,
              )}
            />
          </span>
          {suffix === undefined ? null : (
            <span {...stylex.props(swimlaneTimelineStyles.laneSuffix)}>{suffix}</span>
          )}
        </button>
      </th>
      <td
        {...stylex.props(
          swimlaneTimelineStyles.bodyCell,
          swimlaneTimelineStyles.laneHeadingContinuationCell,
        )}
        aria-hidden="true"
        colSpan={snapshotCount + 1}
      />
    </tr>
  )
}

const SwimlaneTimelineTrack = forwardRef<HTMLTableRowElement, SwimlaneTimelineTrackProps>(
  function SwimlaneTimelineTrack({ children, label }, forwardedRef) {
    const { expanded } = useLaneContext()
    const visibleLabel = label.length > 12 ? `${label.slice(0, 12)}…` : label
    return (
      <tr
        data-slot="swimlane-timeline-track"
        hidden={expanded === false}
        ref={forwardedRef}
      >
        <th
          {...stylex.props(swimlaneTimelineStyles.bodyCell, swimlaneTimelineStyles.trackLabel)}
          aria-label={label}
          scope="row"
          title={label}
        >
          {visibleLabel}
        </th>
        {children}
        <td
          {...stylex.props(swimlaneTimelineStyles.bodyCell, swimlaneTimelineStyles.cell)}
          aria-hidden="true"
        />
      </tr>
    )
  },
)

const SwimlaneTimelineCell = forwardRef<HTMLTableCellElement, SwimlaneTimelineCellProps>(
  function SwimlaneTimelineCell(props, forwardedRef) {
    const { label, onActivate, selected = false, status } = props
    const isSelected = status === 'active' && selected === true
    return (
      <td
        {...stylex.props(
          swimlaneTimelineStyles.bodyCell,
          swimlaneTimelineStyles.cell,
          status === 'active' && swimlaneTimelineStyles.cellActive,
          isSelected === true && swimlaneTimelineStyles.cellSelected,
        )}
        aria-label={status === 'active' ? undefined : label}
        data-selected={isSelected === true ? 'true' : undefined}
        data-slot="swimlane-timeline-cell"
        data-status={status}
        ref={forwardedRef}
      >
        {status === 'active' ? (
          <button
            {...stylex.props(swimlaneTimelineStyles.cellAction)}
            aria-label={label}
            aria-pressed={isSelected}
            type="button"
            onClick={onActivate}
          >
            <span
              {...stylex.props(swimlaneTimelineStyles.statusMarker)}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </td>
    )
  },
)

export const SwimlaneTimeline = Object.assign(SwimlaneTimelineRoot, {
  Root: SwimlaneTimelineRoot,
  Header: SwimlaneTimelineHeader,
  Lane: SwimlaneTimelineLane,
  LaneTrigger: SwimlaneTimelineLaneTrigger,
  Track: SwimlaneTimelineTrack,
  Cell: SwimlaneTimelineCell,
})
