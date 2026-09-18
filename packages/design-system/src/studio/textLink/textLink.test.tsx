import { cleanup, render, screen } from '@testing-library/react'
import React, { type ComponentProps } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { TextLink } from './textLink'

const RouterLink = React.forwardRef<HTMLAnchorElement, { to: string } & ComponentProps<'a'>>(
  function RouterLink({ to, ...props }, ref) {
    return <a ref={ref} href={to} {...props} />
  },
)

afterEach(cleanup)

describe('TextLink', () => {
  it('composes styles and semantics onto a router link', () => {
    render(<TextLink render={<RouterLink to="/components" />}>Browse components</TextLink>)

    const link = screen.getByRole('link', { name: 'Browse components' })

    expect(link.getAttribute('href')).toBe('/components')
    expect(link.getAttribute('role')).toBeNull()
  })

  it('rejects styling escape hatches', () => {
    // @ts-expect-error TextLink only accepts constrained design-system styles.
    const className = <TextLink className="consumer-style" href="/docs" />
    // @ts-expect-error TextLink only accepts constrained design-system styles.
    const style = <TextLink style={{ color: 'red' }} href="/docs" />

    expect(className).toBeDefined()
    expect(style).toBeDefined()
  })

  it('strips styling escape hatches passed by untyped consumers', () => {
    render(
      <TextLink
        href="/docs"
        {...({
          'data-testid': 'link',
          className: 'consumer-style',
          color: 'red',
          style: { color: 'red' },
        } as object)}
      >
        Documentation
      </TextLink>,
    )

    const link = screen.getByTestId('link')

    expect(link.className).not.toContain('consumer-style')
    expect(link.getAttribute('color')).toBeNull()
    expect(link.style.color).not.toBe('red')
  })
})
