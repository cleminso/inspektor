import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Accordion } from './accordion'

afterEach(cleanup)

describe('Accordion', () => {
  it('toggles a panel from its trigger', () => {
    render(
      <Accordion defaultValue={['tables']}>
        <Accordion.Item value="tables">
          <Accordion.Header>
            <Accordion.Trigger suffix="14">Tables</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Table list</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    )

    const trigger = screen.getByRole('button', { name: 'Tables14' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
