import { render, screen, within } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  BrandHero,
  BrandSiteFrame,
  BrandWordmark,
  type BrandHeroProps,
  type BrandSiteFrameProps,
  type BrandWordmarkProps,
} from './index'

describe('brand components', () => {
  it('renders the site frame and hero with one page heading', () => {
    render(
      <BrandSiteFrame header={<BrandWordmark />}>
        <BrandHero
          title="inspektor studio"
          continuation="explore your Jazz application data"
          description="Description"
        />
      </BrandSiteFrame>,
    )

    expect(screen.getByRole('banner')).not.toBeNull()
    expect(screen.getByRole('main')).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Inspektor' })).not.toBeNull()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'inspektor studio explore your Jazz application data',
      }),
    ).not.toBeNull()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
    expect(screen.queryByRole('contentinfo')).toBeNull()
  })

  it('strips styling escape hatches passed by untyped consumers', () => {
    const { container } = render(
      <BrandSiteFrame
        {...({
          'data-testid': 'frame',
          className: 'consumer-style',
          dangerouslySetInnerHTML: { __html: 'Consumer frame markup' },
          style: { color: 'red' },
        } as object)}
        header={<BrandWordmark />}
      >
        <BrandHero
          {...({
            'data-testid': 'hero',
            className: 'consumer-style',
            children: 'Consumer content',
            dangerouslySetInnerHTML: { __html: 'Consumer markup' },
            style: { color: 'red' },
          } as object)}
          title="Page"
          continuation="Continuation"
          description="Description"
        />
      </BrandSiteFrame>,
    )

    const rendered = within(container)
    expect(rendered.getByTestId('frame').className).not.toContain('consumer-style')
    expect(rendered.getByTestId('frame').style.color).not.toBe('red')
    expect(rendered.getByTestId('hero').className).not.toContain('consumer-style')
    expect(rendered.getByTestId('hero').style.color).not.toBe('red')
    expect(rendered.queryByText('Consumer frame markup')).toBeNull()
    expect(rendered.queryByText('Consumer content')).toBeNull()
    expect(rendered.queryByText('Consumer markup')).toBeNull()
  })

  it('preserves the canonical wordmark for untyped consumers', () => {
    const { container } = render(
      <BrandWordmark
        {...({
          'aria-labelledby': 'consumer-label',
          children: 'Consumer content',
          className: 'consumer-style',
          dangerouslySetInnerHTML: { __html: 'Consumer markup' },
          style: { color: 'red' },
        } as object)}
      />,
    )

    const wordmark = within(container).getByRole('img', { name: 'Inspektor' })
    expect(wordmark.hasAttribute('aria-labelledby')).toBe(false)
    expect(wordmark.getAttribute('class')).not.toContain('consumer-style')
    expect(wordmark.style.color).not.toBe('red')
    expect(wordmark.querySelectorAll('use')).toHaveLength(65)
  })

  it('rejects consumer-owned presentation and hero structure', () => {
    type RootExports = typeof import('../index')
    type BrandLeakedIntoRoot = 'BrandSiteFrame' extends keyof RootExports ? true : false
    type HeroAcceptsClassName = 'className' extends keyof BrandHeroProps ? true : false
    type HeroAcceptsChildren = 'children' extends keyof BrandHeroProps ? true : false
    type HeroAcceptsStyle = 'style' extends keyof BrandHeroProps ? true : false
    type FrameAcceptsUnsafeHtml = 'dangerouslySetInnerHTML' extends keyof BrandSiteFrameProps
      ? true
      : false
    type WordmarkAcceptsUnsafeHtml = 'dangerouslySetInnerHTML' extends keyof BrandWordmarkProps
      ? true
      : false

    // @ts-expect-error BrandSiteFrame owns its presentation.
    const frameClassName = <BrandSiteFrame className="consumer-style" header={null} />
    // @ts-expect-error BrandWordmark owns its presentation.
    const wordmarkClassName = <BrandWordmark className="consumer-style" />

    expect(frameClassName).toBeDefined()
    expect(wordmarkClassName).toBeDefined()
    expectTypeOf<BrandLeakedIntoRoot>().toEqualTypeOf<false>()
    expectTypeOf<HeroAcceptsClassName>().toEqualTypeOf<false>()
    expectTypeOf<HeroAcceptsChildren>().toEqualTypeOf<false>()
    expectTypeOf<HeroAcceptsStyle>().toEqualTypeOf<false>()
    expectTypeOf<FrameAcceptsUnsafeHtml>().toEqualTypeOf<false>()
    expectTypeOf<WordmarkAcceptsUnsafeHtml>().toEqualTypeOf<false>()
  })
})
