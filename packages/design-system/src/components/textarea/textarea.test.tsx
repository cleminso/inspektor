import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../field/field'
import { Textarea } from './textarea'

afterEach(cleanup)

describe('Textarea', () => {
  it('participates in Field labeling and value changes', () => {
    const onValueChange = vi.fn((_value: string, _details: { event: Event }) => undefined)
    render(
      <Field.Root>
        <Field.Label>JSON value</Field.Label>
        <Textarea onValueChange={onValueChange} />
      </Field.Root>,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'JSON value' }), {
      target: { value: '{ "enabled": true }' },
    })

    expect(onValueChange.mock.calls[0]?.[0]).toBe('{ "enabled": true }')
    expect(onValueChange.mock.calls[0]?.[1].event).toBeInstanceOf(Event)
  })

  it('forwards a textarea ref and fixes the rendered semantics', () => {
    const ref = createRef<HTMLTextAreaElement>()

    render(<Textarea ref={ref} aria-label="Payload" />)

    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Payload' }))
    expect(ref.current?.tagName).toBe('TEXTAREA')

    // @ts-expect-error Textarea does not expose Base Field render substitution.
    const renderProp = <Textarea render={<input />} />
    // @ts-expect-error Textarea refs target the fixed textarea element.
    const inputRef = <Textarea ref={createRef<HTMLInputElement>()} />

    expect(renderProp).toBeDefined()
    expect(inputRef).toBeDefined()
  })

  it('uses the standard scrollbar treatment for overflowing text', () => {
    render(<Textarea aria-label="Payload" />)

    expect(screen.getByRole('textbox', { name: 'Payload' }).getAttribute('data-scrollbar')).toBe(
      'standard',
    )
  })

  it('preserves read-only native behavior', () => {
    render(<Textarea aria-label="Payload" value="{}" readOnly />)

    expect((screen.getByRole('textbox', { name: 'Payload' }) as HTMLTextAreaElement).readOnly).toBe(
      true,
    )
  })
})
