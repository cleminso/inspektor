import { render, screen } from '@testing-library/react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AppShellNavigation } from './appShell'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<'a'> & { to: string }>(function Link(
    { to, ...props },
    ref,
  ) {
    return <a {...props} ref={ref} href={to} />
  }),
}))

describe('AppShell navigation', () => {
  it('renders expandable navigation sections with the current page', () => {
    render(<AppShellNavigation pathname="/components/tree" />)

    expect(screen.getByRole('navigation', { name: 'Design system navigation' })).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getByRole('button', { name: 'Foundations' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: 'Components' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(screen.getByRole('link', { name: 'Tree' }).getAttribute('aria-current')).toBe('page')
  })
})
