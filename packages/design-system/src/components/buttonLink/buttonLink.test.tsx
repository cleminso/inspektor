import { cleanup, render, screen } from '@testing-library/react'
import { createRef, type ComponentProps } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { ButtonLink } from './buttonLink'

afterEach(cleanup)

function RouterLink({ to, ...props }: { to: string } & ComponentProps<'a'>) {
  return <a href={to} {...props} />
}

describe('ButtonLink', () => {
  it('renders an accessible square link for icon-only navigation', () => {
    render(
      <ButtonLink iconOnly aria-label="Open source" href="/source">
        <svg data-testid="source-icon" />
      </ButtonLink>,
    )

    const link = screen.getByRole('link', { name: 'Open source' })

    expect(link.getAttribute('data-icon-only')).toBe('')
    expect(screen.getByTestId('source-icon').parentElement?.getAttribute('aria-hidden')).toBe(
      'true',
    )
  })

  it('requires icon-only links to use their constrained content API', () => {
    // @ts-expect-error Icon-only links require an accessible label.
    const missingLabel = <ButtonLink iconOnly href="/source" />
    // @ts-expect-error Icon-only links do not accept labelled-link suffixes.
    const suffix = <ButtonLink iconOnly aria-label="Open source" href="/source" suffix={<svg />} />

    expect(missingLabel).toBeDefined()
    expect(suffix).toBeDefined()
  })

  it('renders button presentation with native link semantics', () => {
    render(<ButtonLink href="/catalog">Open catalog</ButtonLink>)

    const link = screen.getByRole('link', { name: 'Open catalog' })

    expect(link.getAttribute('href')).toBe('/catalog')
    expect(link.getAttribute('role')).toBeNull()
    expect(link.getAttribute('type')).toBeNull()
    expect(link.getAttribute('data-slot')).toBe('button-link')
  })

  it('composes button presentation onto a router link without button semantics', () => {
    render(
      <ButtonLink variant="secondary" render={<RouterLink to="/components" />}>
        Browse components
      </ButtonLink>,
    )

    const link = screen.getByRole('link', { name: 'Browse components' })

    expect(link.getAttribute('href')).toBe('/components')
    expect(link.getAttribute('role')).toBeNull()
    expect(link.getAttribute('aria-disabled')).toBeNull()
    expect(link.className).not.toBe('')
  })

  it('rejects button-only states and styling escape hatches', () => {
    // @ts-expect-error ButtonLink does not support disabled navigation.
    const disabled = <ButtonLink disabled href="/catalog" />
    // @ts-expect-error ButtonLink does not support button loading behavior.
    const loading = <ButtonLink loading href="/catalog" />
    // @ts-expect-error ButtonLink only accepts constrained design-system styles.
    const className = <ButtonLink className="consumer-style" href="/catalog" />
    // @ts-expect-error ButtonLink only accepts constrained design-system styles.
    const style = <ButtonLink style={{ color: 'red' }} href="/catalog" />
    const ref = <ButtonLink ref={createRef<HTMLAnchorElement>()} href="/catalog" />

    expect(disabled).toBeDefined()
    expect(loading).toBeDefined()
    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(ref).toBeDefined()
  })

  it('strips styling escape hatches passed by untyped consumers', () => {
    render(
      <ButtonLink
        href="/catalog"
        {...({
          'data-testid': 'button-link',
          className: 'consumer-style',
          style: { color: 'red' },
        } as object)}
      >
        Open catalog
      </ButtonLink>,
    )

    const link = screen.getByTestId('button-link')

    expect(link.className).not.toContain('consumer-style')
    expect(link.style.color).not.toBe('red')
  })
})
