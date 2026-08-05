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
      'bg-page', 'bg-layout', 'bg-card', 'bg-popover', 'bg-subtle', 'bg-overlay',
      'bg-backdrop', 'bg-inverse', 'bg-hover', 'bg-pressed', 'bg-selected',
      'bg-disabled', 'bg-primary', 'bg-primary-hover', 'bg-secondary',
      'bg-danger', 'bg-danger-hover',
    ] as const
    const colors = [
      'text-default', 'text-secondary', 'text-muted', 'text-disabled', 'text-link',
      'text-selected', 'text-danger', 'text-on-primary', 'text-on-inverse',
    ] as const
    const borderColors = [
      'border', 'border-secondary', 'border-focused', 'border-warning',
      'border-danger', 'border-danger-subtle', 'border-success',
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

  it('automatically applies the standard scrollbar treatment without reserving empty space', () => {
    render(<Box data-testid="box" overflow="auto" />)

    const box = screen.getByTestId('box')

    expect(box.getAttribute('data-scrollbar')).toBe('standard')
    expect(box.getAttribute('data-scrollbar-gutter')).toBeNull()

    // @ts-expect-error Arbitrary integration classes are not part of the Box contract.
    const unsafe = <Box unsafeClassName="integration-class" />
    // @ts-expect-error Scrollbar appearance is automatic for Box scroll containers.
    const customScrollbar = <Box scrollbar="thin" />
    expect(unsafe).toBeDefined()
    expect(customScrollbar).toBeDefined()
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

  it('does not allow border style to activate the browser medium border width', () => {
    const resolved = resolveBoxStyles(
      { borderColor: 'border', borderStyle: 'solid' },
      'box-border-default',
    )

    expect(resolved.inlineStyle.borderWidth).toBe(0)
  })
})
