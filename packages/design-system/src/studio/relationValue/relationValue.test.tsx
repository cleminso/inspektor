import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RelationValue } from './relationValue'

afterEach(cleanup)

describe('RelationValue', () => {
  it('renders only the stored ID when navigation is absent', () => {
    render(<RelationValue id="account_0123456789" />)

    expect(screen.getByText('account_0123456789')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('account_0123456789').closest('[translate="no"]')).toBeTruthy()
  })

  it('keeps navigation beside the middle-truncated identifier', () => {
    render(
      <RelationValue
        id="account_0123456789"
        navigation={{ href: '/accounts/account_0123456789' }}
      />,
    )

    const link = screen.getByRole('link', { name: 'account_0123456789' })
    const relationValue = link.closest('[data-slot="relation-value"]')
    const navigationIcon = relationValue?.querySelector(
      '[data-slot="relation-value-navigation-icon"]',
    )
    expect(link.getAttribute('href')).toBe('/accounts/account_0123456789')
    const middleTruncate = link.querySelector('[data-slot="middle-truncate"]')
    expect(middleTruncate).toBeTruthy()
    expect(navigationIcon).toBeTruthy()
    expect(link.contains(navigationIcon ?? null)).toBe(true)
    expect(middleTruncate?.contains(navigationIcon ?? null)).toBe(false)
  })

  it('does not accept detail or styling props', () => {
    // @ts-expect-error RelationValue has no resolution state.
    const stateProp = <RelationValue id="account_1" state="missing" />
    // @ts-expect-error RelationValue has no presentation mode.
    const modeProp = <RelationValue id="account_1" mode="details" />
    // @ts-expect-error RelationValue owns its presentation.
    const classNameProp = <RelationValue className="off-system" id="account_1" />

    expect(stateProp).toBeTruthy()
    expect(modeProp).toBeTruthy()
    expect(classNameProp).toBeTruthy()
  })
})
