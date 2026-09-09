import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccordionPlayground, serializeAccordionPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

describe('Accordion playground', () => {
  it('serializes the representative initial accordion', () => {
    const source = serializeAccordionPlayground({
      layout: 'content',
      multiple: false,
      disabled: false,
      itemDisabled: false,
      showSuffix: true,
    })

    expect(source).toContain('defaultValue={["tables"]}')
    expect(source).toContain('suffix={<Text color="muted">14</Text>}')
    expect(source).not.toContain('layout=')
    expect(source).not.toContain('multiple')
  })

  it('serializes curated root and item properties', () => {
    const source = serializeAccordionPlayground({
      layout: 'fill',
      multiple: true,
      disabled: true,
      itemDisabled: true,
      showSuffix: false,
    })

    expect(source).toContain('defaultValue={["tables", "filters"]}')
    expect(source).toContain('layout="fill"')
    expect(source).toContain('multiple')
    expect(source).toContain('disabled')
    expect(source).toContain('<Accordion.Item value="filters" disabled>')
    expect(source).not.toContain('suffix=')
  })

  it('updates the preview and source from item controls', () => {
    const { container } = render(<AccordionPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Disable filters' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Show count' }))

    expect(screen.getByRole('button', { name: 'Filters' }).getAttribute('aria-disabled')).toBe(
      'true',
    )
    expect(screen.queryByText('14')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))
    expect(container.querySelector('pre')?.textContent).toContain(
      '<Accordion.Item value="filters" disabled>',
    )
    expect(container.querySelector('pre')?.textContent).not.toContain('suffix=')
  })

  it('normalizes expanded values when multiple mode changes and resets them', () => {
    render(<AccordionPlayground />)

    fireEvent.click(screen.getByRole('switch', { name: 'Multiple' }))
    expect(screen.getByRole('button', { name: /^Tables/ }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: 'Filters' }).getAttribute('aria-expanded')).toBe(
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }))
    expect(screen.getByRole('button', { name: /^Tables/ }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: 'Filters' }).getAttribute('aria-expanded')).toBe(
      'false',
    )
  })
})
