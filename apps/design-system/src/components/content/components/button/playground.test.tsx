import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ButtonPlayground, serializeButtonPlayground } from './playground'

vi.mock('@/lib/shiki', () => ({ useHighlightedCode: () => null }))

afterEach(cleanup)

const state = {
  size: 'm',
  radius: 'xs',
  layout: 'inline',
  loading: false,
  disabled: false,
  iconOnly: false,
  prefix: false,
  suffix: false,
} as const

describe('Button playground', () => {
  it('serializes the three coordinated examples without redundant default props', () => {
    const source = serializeButtonPlayground({
      primary: { ...state, variant: 'primary' },
      secondary: { ...state, variant: 'secondary' },
      danger: { ...state, variant: 'danger' },
    })

    expect(source).toContain('<Button>Primary action</Button>')
    expect(source).toContain('variant="secondary"')
    expect(source).toContain('variant="danger"')
    expect(source.match(/<Button/g)).toHaveLength(3)
  })

  it('inlines decorative icons without adding application dependencies', () => {
    const source = serializeButtonPlayground({
      primary: { ...state, variant: 'primary', prefix: true },
      secondary: { ...state, variant: 'secondary' },
      danger: { ...state, variant: 'danger' },
    })

    expect(source).toContain('prefix={<svg aria-hidden="true" width={14} height={14}')
    expect(source).not.toContain('lucide-react')
    expect(source).not.toContain('ArrowLeft')
  })

  it('controls and serializes each Button independently', () => {
    const { container } = render(<ButtonPlayground />)
    const iconOnlyControls = screen.getAllByRole('switch', { name: 'Icon only' })

    expect(screen.getByRole('group', { name: 'Primary action' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Secondary action' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Danger action' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reset Primary action controls' })).toBeTruthy()

    fireEvent.click(iconOnlyControls[0])
    fireEvent.click(screen.getByRole('button', { name: 'Show Code' }))

    expect(
      screen.getByRole('button', { name: 'Primary action' }).getAttribute('data-icon-only'),
    ).toBe('')
    expect(
      screen.getByRole('button', { name: 'Secondary action' }).hasAttribute('data-icon-only'),
    ).toBe(false)
    expect(container.querySelector('pre')?.textContent).toContain('aria-label="Primary action"')

    fireEvent.click(iconOnlyControls[0])

    expect(
      screen.getByRole('button', { name: 'Primary action' }).hasAttribute('data-icon-only'),
    ).toBe(false)
    expect(container.querySelector('pre')?.textContent).not.toContain('aria-label="Primary action"')
  })
})
