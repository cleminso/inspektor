import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef, type ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Input } from '../input/input'
import { InputGroup, type InputGroupLinkProps } from './inputGroup'

afterEach(cleanup)

function RouterLink({ to, ...props }: { to: string } & ComponentProps<'a'>) {
  return <a href={to} {...props} />
}

describe('InputGroup', () => {
  it('projects group context onto every interactive member', () => {
    render(
      <InputGroup disabled invalid size="l">
        <Input aria-label="Domain" size="s" />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
        <InputGroup.Action label="Reveal">show</InputGroup.Action>
        <InputGroup.Checkbox label="Set value to NULL">NULL</InputGroup.Checkbox>
      </InputGroup>,
    )

    const input = screen.getByRole('textbox', { name: 'Domain' }) as HTMLInputElement
    expect(input.getAttribute('data-grouped')).toBe('')
    expect(input.getAttribute('data-size')).toBe('l')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Reveal' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(
      screen.getByRole('checkbox', { name: 'Set value to NULL' }).getAttribute('aria-disabled'),
    ).toBe('true')
  })

  it('moves focus-visible treatment to the compound root', () => {
    render(
      <InputGroup>
        <Input aria-label="Domain" />
      </InputGroup>,
    )
    const input = screen.getByRole('textbox', { name: 'Domain' })
    const group = input.closest('[data-slot="input-group"]')
    const matches = vi.spyOn(input, 'matches').mockReturnValue(true)

    fireEvent.focus(input)

    expect(group?.getAttribute('data-focus-visible')).toBe('')

    fireEvent.blur(input)

    expect(group?.getAttribute('data-focus-visible')).toBe(null)

    matches.mockReturnValue(false)

    fireEvent.focus(input)

    expect(group?.getAttribute('data-focused')).toBe('')
    expect(group?.getAttribute('data-focus-visible')).toBe(null)
  })

  it('keeps the NULL checkbox interactive when only the Input is disabled', () => {
    const onCheckedChange = vi.fn()
    render(
      <InputGroup>
        <Input aria-label="Value" disabled />
        <InputGroup.Checkbox label="Set value to NULL" onCheckedChange={onCheckedChange}>
          NULL
        </InputGroup.Checkbox>
      </InputGroup>,
    )

    fireEvent.click(screen.getByText('NULL'))

    expect(
      screen.getByRole('checkbox', { name: 'Set value to NULL' }).getAttribute('aria-disabled'),
    ).not.toBe('true')
    expect(onCheckedChange).toHaveBeenCalledOnce()
  })

  it('composes supplementary guidance onto the complete checkbox control', () => {
    render(
      <InputGroup>
        <Input aria-label="Value" />
        <InputGroup.Checkbox label="Set value to NULL" tooltip="Insert NULL explicitly.">
          NULL
        </InputGroup.Checkbox>
      </InputGroup>,
    )

    screen.getByRole('checkbox', {
      name: 'Set value to NULL',
      description: 'Insert NULL explicitly.',
    })
  })

  it('exposes persistent action state for toggle actions', () => {
    render(
      <InputGroup>
        <Input aria-label="Password" />
        <InputGroup.Action label="Hide password" pressed>
          hide
        </InputGroup.Action>
      </InputGroup>,
    )

    expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('data-pressed')).toBe(
      '',
    )
  })

  it('composes a full input-group member onto a router link', () => {
    const ref = createRef<HTMLAnchorElement>()

    render(
      <InputGroup size="l">
        <Input aria-label="Relation ID" />
        <InputGroup.Link
          ref={ref}
          label="Open referenced table"
          render={<RouterLink to="/tables/rooms" />}
        >
          <svg data-testid="relation-arrow" />
        </InputGroup.Link>
      </InputGroup>,
    )

    const link = screen.getByRole('link', { name: 'Open referenced table' })

    expect(link.getAttribute('href')).toBe('/tables/rooms')
    expect(link.getAttribute('data-slot')).toBe('input-group-link')
    expect(link.contains(screen.getByTestId('relation-arrow'))).toBe(true)
    expect(ref.current).toBe(link)
  })

  it('requires a link destination and rejects runtime styling overrides', () => {
    // @ts-expect-error InputGroup.Link requires href or render.
    const missingDestination = <InputGroup.Link label="Open source">open</InputGroup.Link>
    const unsafeProps = {
      className: 'unsafe-class',
      color: 'red',
      href: '/source',
      style: { color: 'red' },
    } as unknown as InputGroupLinkProps

    render(
      <InputGroup>
        <Input aria-label="Source" />
        <InputGroup.Link
          {...unsafeProps}
          label="Open source"
        >
          open
        </InputGroup.Link>
      </InputGroup>,
    )

    const link = screen.getByRole('link', { name: 'Open source' })
    expect(link.classList.contains('unsafe-class')).toBe(false)
    expect(link.hasAttribute('color')).toBe(false)
    expect(link.getAttribute('style')).toBeNull()
    expect(missingDestination).toBeTruthy()
  })

  it('prevents disabled group links from receiving focus or activating', () => {
    const onClick = vi.fn()

    render(
      <InputGroup disabled>
        <Input aria-label="Source" />
        <InputGroup.Link
          href="/source"
          label="Open source"
          onClick={onClick}
        >
          open
        </InputGroup.Link>
      </InputGroup>,
    )

    const link = screen.getByRole('link', { name: 'Open source' })
    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(link.getAttribute('tabindex')).toBe('-1')
    expect(fireEvent.click(link)).toBe(false)
    expect(onClick).not.toHaveBeenCalled()
  })
})
