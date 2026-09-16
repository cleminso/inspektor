import { render, screen, within } from '@testing-library/react'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import { BrandHero, BrandPageFrame, BrandSection, BrandText, BrandWordmark } from './index'

describe('brand components', () => {
  it('provides the accepted semantic page structure', () => {
    render(
      <BrandPageFrame data-testid="frame">
        <BrandPageFrame.Header>
          <BrandWordmark />
        </BrandPageFrame.Header>
        <BrandPageFrame.Main>
          <BrandHero>
            <BrandHero.Content>
              <BrandHero.Frame>
                <BrandHero.Message>
                  <BrandHero.Headings>
                    <BrandText variant="pageHeading">Page</BrandText>
                    <BrandText variant="sectionHeading">Section</BrandText>
                  </BrandHero.Headings>
                  <BrandText variant="description">Description</BrandText>
                </BrandHero.Message>
              </BrandHero.Frame>
            </BrandHero.Content>
          </BrandHero>
        </BrandPageFrame.Main>
        <BrandPageFrame.Footer aria-hidden="true" />
      </BrandPageFrame>,
    )

    expect(screen.getByTestId('frame').tagName).toBe('DIV')
    expect(screen.getByRole('banner')).not.toBeNull()
    expect(screen.getByRole('main')).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Inspektor' })).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Page')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Section')
    expect(screen.queryByRole('contentinfo')).toBeNull()
  })

  it('selects native elements from closed text roles', () => {
    const { container } = render(
      <BrandSection>
        <BrandText variant="pageHeading">Page</BrandText>
        <BrandText variant="sectionHeading">Section</BrandText>
        <BrandText variant="description">Description</BrandText>
      </BrandSection>,
    )

    const rendered = within(container)
    expect(rendered.getByRole('heading', { level: 1 }).textContent).toBe('Page')
    expect(rendered.getByRole('heading', { level: 2 }).textContent).toBe('Section')
    expect(rendered.getByText('Description').tagName).toBe('P')
  })

  it('strips styling escape hatches passed by untyped consumers', () => {
    const { container } = render(
      <BrandPageFrame {...({ 'data-testid': 'frame', className: 'consumer-style' } as object)}>
        <BrandSection {...({ 'data-testid': 'section', style: { color: 'red' } } as object)}>
          <BrandText
            {...({
              'data-testid': 'text',
              className: 'consumer-style',
              style: { color: 'red' },
            } as object)}
            variant="description"
          >
            Description
          </BrandText>
        </BrandSection>
      </BrandPageFrame>,
    )

    const { getByTestId } = within(container)
    const text = getByTestId('text')
    expect(getByTestId('frame').className).not.toContain('consumer-style')
    expect(getByTestId('section').style.color).not.toBe('red')
    expect(text.className).not.toContain('consumer-style')
    expect(text.style.color).not.toBe('red')
  })

  it('preserves the canonical wordmark name for untyped consumers', () => {
    const { container } = render(
      <BrandWordmark {...({ 'aria-labelledby': 'consumer-label' } as object)} />,
    )

    const wordmark = within(container).getByRole('img', { name: 'Inspektor' })
    expect(wordmark.hasAttribute('aria-labelledby')).toBe(false)
  })

  it('keeps callback refs attached across ordinary renders', () => {
    const ref = vi.fn()
    const { rerender } = render(
      <BrandText ref={ref} variant="description">
        Description
      </BrandText>,
    )

    rerender(
      <BrandText ref={ref} variant="description">
        Updated description
      </BrandText>,
    )

    expect(ref).toHaveBeenCalledTimes(1)
    expect(ref).toHaveBeenLastCalledWith(screen.getByText('Updated description'))
  })

  it('preserves React callback-ref cleanup', () => {
    const cleanup = vi.fn()
    const ref = vi.fn(() => cleanup)
    const { unmount } = render(
      <BrandText ref={ref} variant="description">
        Description
      </BrandText>,
    )

    unmount()

    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('rejects consumer-owned presentation props', () => {
    type RootExports = typeof import('../index')
    type BrandLeakedIntoRoot = 'BrandText' extends keyof RootExports ? true : false

    // @ts-expect-error BrandText owns its presentation.
    const className = <BrandText className="consumer-style" variant="description" />
    // @ts-expect-error BrandPageFrame owns its presentation.
    const frameClassName = <BrandPageFrame className="consumer-style" />
    // @ts-expect-error BrandSection owns its presentation.
    const style = <BrandSection style={{ color: 'red' }} />
    // @ts-expect-error BrandHero owns its presentation.
    const heroStyle = <BrandHero style={{ color: 'red' }} />
    // @ts-expect-error BrandWordmark owns its presentation.
    const wordmarkClassName = <BrandWordmark className="consumer-style" />
    // @ts-expect-error BrandText exposes only accepted roles.
    const variant = <BrandText variant="heading" />

    expect(className).toBeDefined()
    expect(frameClassName).toBeDefined()
    expect(style).toBeDefined()
    expect(heroStyle).toBeDefined()
    expect(wordmarkClassName).toBeDefined()
    expect(variant).toBeDefined()
    expectTypeOf<BrandLeakedIntoRoot>().toEqualTypeOf<false>()
  })
})
