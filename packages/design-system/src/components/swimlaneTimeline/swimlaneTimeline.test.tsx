import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SwimlaneTimeline } from './swimlaneTimeline'

afterEach(cleanup)

const opaqueTrackLabel = '7f1a9c2d8e4b6a03c5d7f90123456789abcdef0123456789abcdef0123456789'

function Timeline({ defaultExpanded = true }: { defaultExpanded?: boolean }) {
  return (
    <SwimlaneTimeline aria-label="Query activity">
      <SwimlaneTimeline.Header label="Tables / queries">
        <time dateTime="13:32">13:32</time>
        <time dateTime="13:52">13:52</time>
        <time dateTime="14:12">14:12</time>
      </SwimlaneTimeline.Header>
      <SwimlaneTimeline.Lane defaultExpanded={defaultExpanded}>
        <SwimlaneTimeline.LaneTrigger suffix="1">Messages</SwimlaneTimeline.LaneTrigger>
        <SwimlaneTimeline.Track label={opaqueTrackLabel}>
          <SwimlaneTimeline.Cell
            label="Active at 13:32"
            status="active"
            onActivate={() => undefined}
          />
          <SwimlaneTimeline.Cell label="Inactive at 13:52" status="inactive" />
          <SwimlaneTimeline.Cell label="Unknown at 14:12" status="unknown" />
        </SwimlaneTimeline.Track>
      </SwimlaneTimeline.Lane>
    </SwimlaneTimeline>
  )
}

describe('SwimlaneTimeline', () => {
  it('keeps one native table with aligned header and track columns', () => {
    const { container } = render(<Timeline />)
    const table = screen.getByRole('table', { name: 'Query activity' })
    const directChildren = Array.from(table.children).map((child) => child.tagName)
    const track = screen.getByRole('rowheader', { name: opaqueTrackLabel }).closest('tr')
    const laneHeading = screen.getByRole('button', { name: /Messages/ }).closest('th')
    const laneHeadingRow = laneHeading?.closest('tr')
    const laneHeadingContinuation = laneHeadingRow?.querySelector('td')

    expect(container.querySelectorAll('table')).toHaveLength(1)
    expect(directChildren).toEqual(['COLGROUP', 'THEAD', 'TBODY'])
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4)
    expect(table.querySelector('colgroup')?.children).toHaveLength(5)
    expect(laneHeading?.colSpan).toBe(1)
    expect(laneHeadingContinuation?.colSpan).toBe(4)
    expect(laneHeadingRow?.children).toHaveLength(2)
    expect(track?.children).toHaveLength(5)
  })

  it('updates expanded state and hides only track rows when collapsed', () => {
    render(<Timeline />)
    const trigger = screen.getByRole('button', { name: /Messages/ })
    const laneHeadingRow = trigger.closest('tr')
    const trackRow = screen.getByRole('rowheader', { name: opaqueTrackLabel }).closest('tr')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trackRow?.hidden).toBe(false)

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(laneHeadingRow?.hidden).toBe(false)
    expect(trackRow?.hidden).toBe(true)
  })

  it('keeps structural continuation cells without snapshots', () => {
    render(
      <SwimlaneTimeline aria-label="Empty timeline">
        <SwimlaneTimeline.Header label="Queries">{null}</SwimlaneTimeline.Header>
        <SwimlaneTimeline.Lane>
          <SwimlaneTimeline.LaneTrigger>Messages</SwimlaneTimeline.LaneTrigger>
          <SwimlaneTimeline.Track label="group-a">{null}</SwimlaneTimeline.Track>
        </SwimlaneTimeline.Lane>
      </SwimlaneTimeline>,
    )

    expect(
      screen.getByRole('columnheader', { name: 'Queries' }).closest('tr')?.children,
    ).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Messages' }).closest('tr')?.children).toHaveLength(2)
    expect(screen.getByRole('rowheader', { name: 'group-a' }).closest('tr')?.children).toHaveLength(
      2,
    )
  })

  it('uses a native button for active cell activation', () => {
    const onActivate = vi.fn()
    render(
      <SwimlaneTimeline aria-label="Query activity">
        <SwimlaneTimeline.Header label="Queries">
          <time dateTime="14:12">14:12</time>
        </SwimlaneTimeline.Header>
        <SwimlaneTimeline.Lane>
          <SwimlaneTimeline.LaneTrigger>Messages</SwimlaneTimeline.LaneTrigger>
          <SwimlaneTimeline.Track label="group-a">
            <SwimlaneTimeline.Cell
              label="Open active snapshot"
              status="active"
              onActivate={onActivate}
            />
          </SwimlaneTimeline.Track>
        </SwimlaneTimeline.Lane>
      </SwimlaneTimeline>,
    )
    const cellAction = screen.getByRole('button', { name: 'Open active snapshot' })

    expect(cellAction.tagName).toBe('BUTTON')
    expect(cellAction.tabIndex).toBe(0)

    fireEvent.click(cellAction)

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('exposes selected and unknown states without distinguishing the final column', () => {
    render(
      <SwimlaneTimeline aria-label="Query activity">
        <SwimlaneTimeline.Header label="Queries">
          <span>Earlier</span>
          <span>Later</span>
        </SwimlaneTimeline.Header>
        <SwimlaneTimeline.Lane>
          <SwimlaneTimeline.LaneTrigger>Messages</SwimlaneTimeline.LaneTrigger>
          <SwimlaneTimeline.Track label="group-a">
            <SwimlaneTimeline.Cell
              label="Selected snapshot"
              status="active"
              selected
              onActivate={() => undefined}
            />
            <SwimlaneTimeline.Cell label="Snapshot status unknown" status="unknown" />
          </SwimlaneTimeline.Track>
        </SwimlaneTimeline.Lane>
      </SwimlaneTimeline>,
    )
    const selected = screen.getByRole('button', { name: 'Selected snapshot' })
    const finalHeader = screen.getByRole('columnheader', { name: 'Later' })
    const unknown = screen.getByRole('cell', { name: 'Snapshot status unknown' })

    expect(selected.getAttribute('aria-pressed')).toBe('true')
    expect(selected.closest('td')?.getAttribute('data-selected')).toBe('true')
    expect(finalHeader.getAttribute('aria-current')).toBeNull()
    expect(finalHeader.getAttribute('data-latest')).toBeNull()
    expect(unknown.getAttribute('aria-current')).toBeNull()
    expect(unknown.getAttribute('data-latest')).toBeNull()
    expect(unknown.getAttribute('data-status')).toBe('unknown')
  })

  it('preserves the complete accessible track label when visual truncation is needed', () => {
    render(<Timeline />)

    const trackLabel = screen.getByRole('rowheader', { name: opaqueTrackLabel })

    expect(trackLabel.textContent).toBe('7f1a9c2d8e4b…')
    expect(trackLabel.title).toBe(opaqueTrackLabel)
  })
})
