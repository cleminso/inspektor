import { cleanup, render, screen } from '@testing-library/react'
import { createRef, type ComponentProps } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { ButtonLink } from './buttonLink'

afterEach(cleanup)

function RouterLink({ to, ...props }: { to: string } & ComponentProps<'a'>) {
  return <a href={to} {...props} />
}

describe('ButtonLink', () => {
  it('projects icon-only and row layouts onto the link root', () => {
    render(
      <>
        <ButtonLink iconOnly aria-label="Open source" href="/source">
          <svg data-testid="source-icon" />
        </ButtonLink>
        <ButtonLink href="/catalog" layout="row">
          Open catalog
        </ButtonLink>
      </>,
    )

    const link = screen.getByRole('link', { name: 'Open source' })
    const rowLink = screen.getByRole('link', { name: 'Open catalog' })

    expect(link.getAttribute('data-icon-only')).toBe('')
    expect(screen.getByTestId('source-icon').parentElement?.getAttribute('aria-hidden')).toBe(
      'true',
    )
    expect(rowLink.getAttribute('data-layout')).toBe('row')
    expect(rowLink.getAttribute('data-full-width')).toBe('')
  })

  it('requires icon-only links to use their constrained content API', () => {
    // @ts-expect-error Icon-only links require an accessible label.
    const missingLabel = <ButtonLink iconOnly href="/source" />
    // @ts-expect-error Icon-only links do not accept labelled-link suffixes.
    const suffix = <ButtonLink iconOnly aria-label="Open source" href="/source" suffix={<svg />} />
    // @ts-expect-error Icon-only links do not accept labelled-link layout.
    const layout = <ButtonLink iconOnly aria-label="Open source" href="/source" layout="row" />
    // @ts-expect-error ButtonLink does not support disabled navigation.
    const disabled = <ButtonLink disabled href="/catalog" />
    // @ts-expect-error ButtonLink does not support button loading behavior.
    const loading = <ButtonLink loading href="/catalog" />
    // @ts-expect-error ButtonLink only accepts constrained design-system styles.
    const className = <ButtonLink className="consumer-style" href="/catalog" />
    // @ts-expect-error ButtonLink only accepts constrained design-system styles.
    const style = <ButtonLink style={{ color: 'red' }} href="/catalog" />
    // @ts-expect-error ButtonLink content distribution is selected through layout.
    const justify = <ButtonLink justify="start" href="/catalog" />
    // @ts-expect-error ButtonLink width is selected through layout.
    const fullWidth = <ButtonLink fullWidth href="/catalog" />
    // @ts-expect-error ButtonLink exposes only supported inline and row layouts.
    const fill = <ButtonLink layout="fill" href="/catalog" />

    expect(missingLabel).toBeDefined()
    expect(suffix).toBeDefined()
    expect(layout).toBeDefined()
    expect(disabled).toBeDefined()
    expect(loading).toBeDefined()
    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(justify).toBeDefined()
    expect(fullWidth).toBeDefined()
    expect(fill).toBeDefined()
  })

  it('composes button presentation onto a router link without button semantics', () => {
    const ref = createRef<HTMLAnchorElement>()

    render(
      <ButtonLink ref={ref} variant="secondary" render={<RouterLink to="/components" />}>
        Browse components
      </ButtonLink>,
    )

    const link = screen.getByRole('link', { name: 'Browse components' })

    expect(link.getAttribute('href')).toBe('/components')
    expect(link.getAttribute('role')).toBeNull()
    expect(link.getAttribute('aria-disabled')).toBeNull()
    expect(ref.current).toBe(link)
  })

  it('preserves style props received through render composition', () => {
    render(
      <ButtonLink
        href="/catalog"
        {...({
          'data-testid': 'button-link',
          className: 'composition-marker',
          style: { '--composition-marker': 'preserved' },
        } as object)}
      >
        Open catalog
      </ButtonLink>,
    )

    const link = screen.getByTestId('button-link')

    expect(link.className).toContain('composition-marker')
    expect(link.style.getPropertyValue('--composition-marker')).toBe('preserved')
  })
})
