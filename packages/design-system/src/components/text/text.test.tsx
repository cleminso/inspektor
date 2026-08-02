import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { Text } from './text'

describe('Text', () => {
  it('rejects native styling escape hatches', () => {
    // @ts-expect-error Text only accepts constrained design-system props.
    const className = <Text className="consumer-style" />
    // @ts-expect-error Text only accepts constrained design-system props.
    const style = <Text style={{ color: 'red' }} />
    // @ts-expect-error Text colors must be readable on neutral surfaces.
    const inverse = <Text color="inverse" />

    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(inverse).toBeDefined()
  })

  it('supports neutral-surface semantic text colors', () => {
    render(
      <>
        <Text color="default">Default</Text>
        <Text color="muted">Muted</Text>
        <Text color="disabled">Disabled</Text>
        <Text color="link">Link</Text>
        <Text color="danger">Danger</Text>
      </>,
    )

    expect(screen.getByText('Default').className).not.toBe('')
    expect(screen.getByText('Muted').className).not.toBe('')
    expect(screen.getByText('Disabled').className).not.toBe('')
    expect(screen.getByText('Link').className).not.toBe('')
    expect(screen.getByText('Danger').className).not.toBe('')
  })

  it('renders preserved monospace source text', () => {
    render(<Text as="pre" monospace>{`line one\nline two`}</Text>)

    const source = screen.getByText(/line one/)

    expect(source.tagName).toBe('PRE')
    expect(source.textContent).toBe('line one\nline two')
  })

  it('reserves interactive link styling for the TextLink component', () => {
    // @ts-expect-error Text does not expose interactive link styling.
    const interactive = <Text color="interactive">Button</Text>

    expect(interactive).toBeDefined()
  })

  it('strips styling escape hatches passed by untyped consumers', () => {
    render(
      <Text
        {...({
          'data-testid': 'text',
          className: 'consumer-style',
          style: { color: 'red' },
        } as object)}
      >
        Text
      </Text>,
    )

    const text = screen.getByTestId('text')

    expect(text.className).not.toContain('consumer-style')
    expect(text.style.color).not.toBe('red')
  })

  it('renders a text-shaped placeholder while loading', () => {
    const { container } = render(
      <Text {...({ loading: true, placeholderText: 'Account name' } as object)}>
        Account
      </Text>,
    )

    expect(container.querySelector('[data-slot="text-skeleton"]')).not.toBeNull()
    expect(screen.getByText('Account name')).not.toBeNull()
    expect(screen.getByLabelText('Account name').getAttribute('aria-busy')).toBe('true')
  })

  it('adds line-through treatment through a constrained prop', () => {
    render(
      <>
        <Text data-testid="regular">Regular</Text>
        <Text data-testid="struck" {...({ lineThrough: true } as object)}>Struck</Text>
      </>,
    )

    expect(screen.getByTestId('struck').className).not.toBe(
      screen.getByTestId('regular').className,
    )
  })

  it('types refs from the selected text element', () => {
    const label = <Text as="label" ref={createRef<HTMLLabelElement>()}>Label</Text>
    // @ts-expect-error A paragraph ref does not match a label.
    const invalidLabel = <Text as="label" ref={createRef<HTMLParagraphElement>()}>Label</Text>

    expect(label).toBeDefined()
    expect(invalidLabel).toBeDefined()
  })
})
