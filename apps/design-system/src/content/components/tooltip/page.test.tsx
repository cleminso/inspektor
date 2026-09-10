import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentPage } from '@/components/docs/componentPage'
import { tooltipItem } from '@/lib/registry'

import TooltipContent from './page.mdx'

describe('Tooltip documentation', () => {
  it('renders default and no-delay placement scenarios', () => {
    render(
      <ComponentPage item={tooltipItem}>
        <TooltipContent />
      </ComponentPage>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Tooltip' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Default' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'No delay' })).toBeTruthy()

    const examples = screen.getAllByRole('region', { name: 'Component example' })
    expect(examples).toHaveLength(2)

    for (const example of examples) {
      expect(within(example).getByRole('button', { name: 'Top' })).toBeTruthy()
      expect(within(example).getByRole('button', { name: 'Bottom' })).toBeTruthy()
      expect(within(example).getByRole('button', { name: 'Left' })).toBeTruthy()
      expect(within(example).getByRole('button', { name: 'Right' })).toBeTruthy()
    }
  })

  it('renders each no-delay tooltip on its documented side', async () => {
    render(
      <ComponentPage item={tooltipItem}>
        <TooltipContent />
      </ComponentPage>,
    )

    const noDelayExample = screen.getAllByRole('region', { name: 'Component example' })[1]
    if (noDelayExample === undefined) {
      throw new Error('Expected the no-delay Tooltip example')
    }

    const placements = [
      ['Top', 'Shows the complete connection URL', 'top'],
      ['Bottom', 'Includes inherited table permissions', 'bottom'],
      ['Left', 'Uses the selected workspace', 'left'],
      ['Right', 'Keeps the active schema in view', 'right'],
    ] as const

    for (const [triggerName, content, side] of placements) {
      fireEvent.mouseEnter(within(noDelayExample).getByRole('button', { name: triggerName }))

      expect((await screen.findByText(content)).getAttribute('data-side')).toBe(side)
    }
  })
})
