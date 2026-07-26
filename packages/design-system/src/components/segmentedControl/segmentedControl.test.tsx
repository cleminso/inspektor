import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SegmentedControl } from './segmentedControl'

afterEach(cleanup)

describe('SegmentedControl', () => {
  it('links one selected segment to its visible panel', () => {
    render(
      <SegmentedControl defaultValue="details">
        <SegmentedControl.List aria-label="Row representation">
          <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
          <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
        </SegmentedControl.List>
        <SegmentedControl.Panel value="details">Details view</SegmentedControl.Panel>
        <SegmentedControl.Panel value="json">JSON view</SegmentedControl.Panel>
      </SegmentedControl>,
    )

    expect(screen.getByRole('tablist', { name: 'Row representation' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toBe('Details view')
  })

  it('moves selection and displays the corresponding panel', () => {
    render(
      <SegmentedControl defaultValue="details">
        <SegmentedControl.List aria-label="Row representation">
          <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
          <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
        </SegmentedControl.List>
        <SegmentedControl.Panel value="details">Details view</SegmentedControl.Panel>
        <SegmentedControl.Panel value="json">JSON view</SegmentedControl.Panel>
      </SegmentedControl>,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }))

    expect(screen.getByRole('tab', { name: 'JSON' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toBe('JSON view')
  })

  it('renders one presentation indicator inside the segment list', () => {
    const { container } = render(
      <SegmentedControl defaultValue="details">
        <SegmentedControl.List aria-label="Row representation">
          <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
          <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
        </SegmentedControl.List>
        <SegmentedControl.Panel value="details">Details view</SegmentedControl.Panel>
        <SegmentedControl.Panel value="json">JSON view</SegmentedControl.Panel>
      </SegmentedControl>,
    )

    expect(container.querySelector('[data-slot="segmented-control-indicator"]')).toBeTruthy()
  })
})
