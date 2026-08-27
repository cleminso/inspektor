import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Text } from './text'

describe('Text', () => {
  it('constrains the text API to Inspector-owned presentation', () => {
    // @ts-expect-error Text only accepts constrained design-system props.
    const className = <Text className="consumer-style" />
    // @ts-expect-error Text only accepts constrained design-system props.
    const style = <Text style={{ color: 'red' }} />
    // @ts-expect-error Text colors must be readable on neutral surfaces.
    const inverse = <Text color="inverse" />
    // @ts-expect-error Text does not expose interactive link styling.
    const interactive = <Text color="interactive">Button</Text>

    expect(className).toBeDefined()
    expect(style).toBeDefined()
    expect(inverse).toBeDefined()
    expect(interactive).toBeDefined()
  })

  it('selects heading semantics for the heading variant', () => {
    render(<Text variant="heading">Heading</Text>)

    expect(screen.getByRole('heading').tagName).toBe('H2')
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
    render(<Text {...({ loading: true, placeholderText: 'Account name' } as object)}>Account</Text>)

    expect(screen.getByText('Account name')).not.toBeNull()
    expect(screen.getByLabelText('Account name').getAttribute('aria-busy')).toBe('true')
  })
})
