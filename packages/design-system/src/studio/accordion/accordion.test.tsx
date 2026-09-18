import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Accordion } from './accordion'

afterEach(cleanup)

describe('Accordion', () => {
  it('keeps overflow inside panels when filling a constrained parent', () => {
    const { container } = render(
      <Accordion defaultValue={['pinned', 'tables']} layout="fill" multiple>
        <Accordion.Item value="pinned">
          <Accordion.Header>
            <Accordion.Trigger>Pinned</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Pinned list</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="tables">
          <Accordion.Header>
            <Accordion.Trigger>Tables</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Table list</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    )

    const root = container.querySelector('[data-layout="fill"]')
    const panel = screen.getByText('Table list').closest('[data-slot="accordion-panel"]')
    const scrollArea = screen.getByText('Table list').closest('[data-slot="scroll-area"]')

    expect(root?.getAttribute('data-item-spacing')).toBe('inset')
    expect(panel?.getAttribute('data-overflow')).toBe('clipped')
    expect(scrollArea?.getAttribute('data-scrollbar')).toBe('overlay')
  })

  it('renders constrained heading levels while preferring custom composition', () => {
    render(
      <Accordion>
        <Accordion.Item value="tables">
          <Accordion.Header level={2}>
            <Accordion.Trigger>Tables</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Table list</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="records">
          <Accordion.Header level={2} render={<h3>Records</h3>}>
            <Accordion.Trigger>Records</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Record list</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Tables' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Records' })).toBeTruthy()
  })
})
