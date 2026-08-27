import { cleanup, render, screen } from '@testing-library/react'
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
    // @ts-expect-error Arbitrary integration classes are not part of the Box contract.
    const unsafe = <Box unsafeClassName="integration-class" />
    // @ts-expect-error Scrollbar appearance is automatic for Box scroll containers.
    const customScrollbar = <Box scrollbar="thin" />

    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(width).toBeDefined()
    expect(unsafe).toBeDefined()
    expect(customScrollbar).toBeDefined()
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
      { borderColor: 'default', borderStyle: 'solid' },
      'box-border-default',
    )

    expect(resolved.inlineStyle.borderWidth).toBe(0)
  })
})
