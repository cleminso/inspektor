import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { Menu } from '../menu/menu'
import { Button } from './button'
import { buttonStyles } from './button.styles'
import { getButtonVisualStyles } from './buttonVisuals'

const TestArtwork = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<'svg'>>(
  function TestArtwork(props, ref) {
    return <svg {...props} ref={ref} viewBox="0 0 16 16" />
  },
)

afterEach(cleanup)

describe('Button', () => {
  it('does not give disabled ghost actions a filled surface', () => {
    const visualStyles = getButtonVisualStyles({
      variant: 'ghost',
      size: 'xs',
      square: true,
      pressed: false,
      fill: false,
      alignment: 'center',
      radius: 'xs',
      orientation: null,
      disabled: true,
      hasPrefix: false,
      hasSuffix: false,
    })

    expect(visualStyles).not.toContain(buttonStyles.disabled)
  })

  it('renders an accessible square button for icon-only actions', () => {
    render(
      <Button iconOnly aria-label="Toggle panel" aria-pressed>
        <Button.Glyph artwork={TestArtwork} />
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Toggle panel' })
    const icon = button.querySelector('[data-slot="icon"]')

    expect(button.getAttribute('data-icon-only')).toBe('')
    expect(button.getAttribute('data-pressed')).toBe('')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(icon?.getAttribute('data-size')).toBe('s')
    expect(icon?.parentElement?.getAttribute('aria-hidden')).toBe('true')
  })

  it('exposes the compact glyph treatment as a button decision', () => {
    render(
      <Button glyphSize="compact" iconOnly aria-label="Toggle dock" size="xs">
        <Button.Glyph artwork={TestArtwork} />
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Toggle dock' })
    expect(button.getAttribute('data-glyph-size')).toBe('compact')
    expect(button.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('xs')
  })

  it('preserves style props received through render composition', () => {
    render(
      <Button
        {...({
          className: 'composition-marker',
          style: { '--composition-marker': 'preserved' },
        } as object)}
      >
        Actions
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Actions' })

    expect(button.classList.contains('composition-marker')).toBe(true)
    expect(button.style.getPropertyValue('--composition-marker')).toBe('preserved')
  })

  it('preserves behavior and refs when composed as a menu trigger', () => {
    let clickCount = 0
    const ref = { current: null as HTMLElement | null }

    render(
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              ref={ref}
              variant="secondary"
              onClick={() => {
                clickCount += 1
              }}
            />
          }
        >
          Actions
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Rename</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    )

    const trigger = screen.getByRole('button', { name: 'Actions' })

    expect(ref.current).toBe(trigger)
    fireEvent.click(trigger)
    expect(clickCount).toBe(1)
    expect(screen.getByRole('menu')).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('prevents button glyphs from selecting an independent icon size', () => {
    const glyph = (
      // @ts-expect-error Button owns the glyph size relationship.
      <Button.Glyph artwork={TestArtwork} size="m" />
    )

    expect(glyph).toBeDefined()
  })

  it('requires icon-only actions to use their constrained content API', () => {
    const missingLabel = (
      // @ts-expect-error Icon-only actions require an accessible label.
      <Button iconOnly>
        <svg />
      </Button>
    )
    // @ts-expect-error Icon-only actions do not accept labelled-button prefixes.
    const prefix = <Button iconOnly aria-label="Add item" prefix={<svg />} />

    expect(missingLabel).toBeDefined()
    expect(prefix).toBeDefined()
  })

  it('uses disabled button semantics while loading and prevents activation', () => {
    let activationCount = 0

    render(
      <Button
        loading
        onClick={() => {
          activationCount += 1
        }}
      >
        Save changes
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Save changes' })
    fireEvent.click(button)

    expect(button.getAttribute('data-disabled')).toBe('')
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(activationCount).toBe(0)
  })

  it('keeps disabled actions focusable only when their explanation must remain discoverable', () => {
    render(
      <Button disabled focusableWhenDisabled>
        Previous page
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Previous page' })

    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect((button as HTMLButtonElement).disabled).toBe(false)
    expect(button.tabIndex).toBe(0)
  })

  it('uses a full-width start-aligned row layout', () => {
    render(
      <Button layout="row" prefix={<span>Prefix</span>} suffix={<span>Suffix</span>}>
        Label
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Label' })
    const fillClassName = stylex.props(buttonStyles.fill).className
    const alignStartClassName = stylex.props(buttonStyles.alignStart).className

    expect(button.getAttribute('data-layout')).toBe('row')
    expect(button.getAttribute('data-full-width')).toBe('')
    expect(fillClassName).toBeDefined()
    expect(alignStartClassName).toBeDefined()
    if (fillClassName !== undefined && alignStartClassName !== undefined) {
      expect(button.classList.contains(fillClassName)).toBe(true)
      expect(button.classList.contains(alignStartClassName)).toBe(true)
    }
    expect(button.querySelector('[data-slot="button-leading"]')).toBeNull()
    expect(button.textContent).toBe('PrefixLabelSuffix')
  })

  it('uses a full-width centered fill layout', () => {
    render(<Button layout="fill">Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })

    expect(button.getAttribute('data-layout')).toBe('fill')
    expect(button.getAttribute('data-full-width')).toBe('')
  })

  it('uses an auto-height padded stacked layout for multi-line actions', () => {
    render(
      <Button layout="stacked">
        <span>Connection</span>
        <span>app-id</span>
      </Button>,
    )

    const button = screen.getByRole('button', { name: /Connection/ })

    expect(button.getAttribute('data-layout')).toBe('stacked')
    expect(button.getAttribute('data-full-width')).toBe('')
  })

  it('retains constrained radius choices', () => {
    render(<Button radius="m">Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    const radiusClassName = stylex.props(buttonStyles.radiusM).className

    expect(button.getAttribute('data-radius')).toBe('m')
    expect(radiusClassName).toBeDefined()
    if (radiusClassName !== undefined) {
      expect(button.classList.contains(radiusClassName)).toBe(true)
    }
  })

  it('rejects removed width and alignment combinations', () => {
    // @ts-expect-error Button content distribution is selected through layout.
    const justify = <Button justify="start">Save</Button>
    // @ts-expect-error Button width is selected through layout.
    const fullWidth = <Button fullWidth>Save</Button>
    // @ts-expect-error Button exposes only supported inline, row, and fill layouts.
    const invalidLayout = <Button layout="compact">Save</Button>
    const iconLayout = (
      // @ts-expect-error Icon-only actions do not accept labelled-button layout.
      <Button iconOnly aria-label="Save" layout="row">
        <svg />
      </Button>
    )

    expect(justify).toBeDefined()
    expect(fullWidth).toBeDefined()
    expect(invalidLayout).toBeDefined()
    expect(iconLayout).toBeDefined()
  })

  it('propagates type through a custom render target', () => {
    render(
      <Button type="submit" render={<button data-testid="submit" />}>
        Save changes
      </Button>,
    )

    const button = screen.getByTestId('submit')
    expect(button.getAttribute('type')).toBe('submit')
  })
})
