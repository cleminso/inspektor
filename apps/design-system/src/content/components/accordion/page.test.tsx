import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { accordionItem } from '@/lib/registry'

import AccordionContent from './page.mdx'

describe('Accordion documentation', () => {
  it('renders compound scenarios as interactive examples', () => {
    render(
      <ComponentPage item={accordionItem}>
        <AccordionContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Anatomy' })).toBeTruthy()
    expect(screen.getByText('Table navigation content')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))

    expect(screen.getByText('Filter controls')).toBeTruthy()
  })
})
