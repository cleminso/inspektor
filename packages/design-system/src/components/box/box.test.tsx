import { cleanup, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { resolveBoxStyles } from '../../utils/resolvers'
import { Box } from './box'

afterEach(cleanup)

describe('Box', () => {
  it('rejects native styling escape hatches', () => {
    // @ts-expect-error Box only accepts constrained design-system props.
    const className = <Box className="consumer-style" />
    // @ts-expect-error Box only accepts constrained design-system props.
    const style = <Box style={{ color: 'red' }} />
    // @ts-expect-error Box dimensions must use a semantic role or full width.
    const width = <Box width="120px" />

    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(width).toBeDefined()
  })

  it('resolves every semantic color token accepted by Box', () => {
    const backgroundColors = [
      'bg-page', 'bg-card', 'bg-popover', 'bg-subtle', 'bg-overlay',
      'bg-backdrop', 'bg-inverse', 'bg-hover', 'bg-pressed', 'bg-selected',
      'bg-disabled', 'bg-primary', 'bg-primary-hover', 'bg-secondary',
      'bg-danger', 'bg-danger-hover', 'bg-success', 'bg-accent',
      'bg-notification-warning', 'bg-notification-error',
      'bg-notification-info', 'bg-notification-loading',
    ] as const
    const colors = [
      'text-default', 'text-muted', 'text-subtle', 'text-disabled', 'text-link',
      'text-danger', 'fg-primary', 'fg-secondary', 'fg-danger', 'fg-success',
      'fg-accent', 'fg-inverse', 'fg-notification-warning',
      'fg-notification-error', 'fg-notification-info', 'fg-notification-loading',
    ] as const
    const borderColors = [
      'border', 'border-secondary', 'border-focused', 'border-warning',
      'border-danger', 'border-danger-subtle', 'border-success',
      'border-notification-warning', 'border-notification-error',
      'border-notification-info', 'border-notification-loading',
    ] as const

    for (const backgroundColor of backgroundColors) {
      expect(resolveBoxStyles({ backgroundColor }, 'box-colors').stylexStyles).toHaveLength(1)
    }
    for (const color of colors) {
      expect(resolveBoxStyles({ color }, 'box-colors').stylexStyles).toHaveLength(1)
    }
    for (const borderColor of borderColors) {
      expect(resolveBoxStyles({ borderColor }, 'box-colors').stylexStyles).toHaveLength(1)
    }
  })

  it('forwards semantic DOM attributes', () => {
    render(<Box aria-label="Layout region" />)

    expect(screen.getByLabelText('Layout region').getAttribute('aria-label')).toBe(
      'Layout region',
    )
  })

  it('strips styling escape hatches passed by untyped consumers', () => {
    render(
      <Box
        {...({
          'data-testid': 'box',
          className: 'consumer-style',
          style: { color: 'red' },
        } as object)}
      />,
    )

    const box = screen.getByTestId('box')

    expect(box.className).not.toContain('consumer-style')
    expect(box.style.color).not.toBe('red')
  })

  it('supports an explicitly unsafe class name without reopening native style', () => {
    render(
      <Box
        data-testid="box"
        unsafeClassName="integration-class"
        {...({ style: { color: 'red' } } as object)}
      />,
    )

    const box = screen.getByTestId('box')

    expect(box.className).toContain('integration-class')
    expect(box.style.color).not.toBe('red')
  })

  it('types refs from the selected element', () => {
    const list = <Box as="ul" ref={createRef<HTMLUListElement>()} />
    // @ts-expect-error A div ref does not match an unordered list.
    const invalidList = <Box as="ul" ref={createRef<HTMLDivElement>()} />

    expect(list).toBeDefined()
    expect(invalidList).toBeDefined()
  })

  it('resolves every accepted shadow token', () => {
    const shadows = ['none', 'border', 'small', 'medium'] as const

    for (const boxShadow of shadows) {
      expect(resolveBoxStyles({ boxShadow }, 'box-shadows').stylexStyles).toHaveLength(1)
    }
  })

  it('resolves constrained grid tracks, placement, and aspect ratios', () => {
    const resolved = resolveBoxStyles(
      {
        ...({
          aspectRatio: 'video',
          gridColumn: 'full',
          gridRow: 'span-2',
          gridTemplateColumns: 'two',
          gridTemplateRows: 'three',
        } as object),
      },
      'box-grid',
    )

    expect(resolved.inlineStyle).toMatchObject({
      aspectRatio: '16 / 9',
      gridColumn: '1 / -1',
      gridRow: 'span 2 / span 2',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
    })
  })
})
