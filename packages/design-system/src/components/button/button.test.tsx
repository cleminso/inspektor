import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { Menu } from '../menu/menu'
import { Button } from './button'

const TestArtwork = forwardRef<SVGSVGElement, ComponentPropsWithoutRef<'svg'>>(
  function TestArtwork(props, ref) {
    return <svg {...props} ref={ref} viewBox="0 0 16 16" />
  },
)

afterEach(cleanup)

describe('Button', () => {
  it('keeps button glyph sizing and semantics under Button control', () => {
    render(
      <>
        <Button iconOnly aria-label="Toggle panel" aria-pressed>
          <Button.Glyph artwork={TestArtwork} />
        </Button>
        <Button glyphSize="compact" iconOnly aria-label="Toggle dock" size="xs">
          <Button.Glyph artwork={TestArtwork} />
        </Button>
      </>,
    )

    const button = screen.getByRole('button', { name: 'Toggle panel' })
    const icon = button.querySelector('[data-slot="icon"]')
    const compactButton = screen.getByRole('button', { name: 'Toggle dock' })

    expect(button.getAttribute('data-icon-only')).toBe('')
    expect(button.getAttribute('data-pressed')).toBe('')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(icon?.getAttribute('data-size')).toBe('s')
    expect(icon?.parentElement?.getAttribute('aria-hidden')).toBe('true')
    expect(compactButton.getAttribute('data-glyph-size')).toBe('compact')
    expect(compactButton.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('xs')

    const glyph = (
      // @ts-expect-error Button owns the glyph size relationship.
      <Button.Glyph artwork={TestArtwork} size="m" />
    )
    expect(glyph).toBeDefined()
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

  it('requires icon-only actions to use their constrained content API', () => {
    const missingLabel = (
      // @ts-expect-error Icon-only actions require an accessible label.
      <Button iconOnly>
        <svg />
      </Button>
    )
    // @ts-expect-error Icon-only actions do not accept labelled-button prefixes.
    const prefix = <Button iconOnly aria-label="Add item" prefix={<svg />} />
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

    expect(missingLabel).toBeDefined()
    expect(prefix).toBeDefined()
    expect(justify).toBeDefined()
    expect(fullWidth).toBeDefined()
    expect(invalidLayout).toBeDefined()
    expect(iconLayout).toBeDefined()
  })

  it('centers the loading indicator while preserving the hidden label width', () => {
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
    const content = button.querySelector('[data-slot="button-content"]')
    const indicator = button.querySelector('[data-slot="button-loading-indicator"]')
    fireEvent.click(button)

    expect(content?.textContent).toBe('Save changes')
    expect(indicator?.querySelector('[data-slot="spinner"]')).not.toBeNull()
    expect(button.getAttribute('data-disabled')).toBe('')
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    button.focus()
    expect(document.activeElement).toBe(button)
    expect(activationCount).toBe(0)
  })

  it('projects each labelled layout onto the same button root', () => {
    render(
      <>
        <Button layout="row" prefix={<span>Prefix</span>} suffix={<span>Suffix</span>}>
          Row
        </Button>
        <Button layout="fill">Fill</Button>
        <Button layout="stacked">
          <span>Connection</span>
          <span>app-id</span>
        </Button>
      </>,
    )

    for (const [name, layout] of [
      ['Row', 'row'],
      ['Fill', 'fill'],
      [/Connection/, 'stacked'],
    ] as const) {
      const button = screen.getByRole('button', { name })
      expect(button.getAttribute('data-layout')).toBe(layout)
      expect(button.getAttribute('data-full-width')).toBe('')
    }
  })
})
