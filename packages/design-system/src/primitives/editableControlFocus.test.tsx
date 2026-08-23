import { cleanup, render, screen } from '@testing-library/react'
import * as stylex from '@stylexjs/stylex'
import { afterEach, describe, expect, it } from 'vitest'

import { Input } from '../components/input/input'
import { Select } from '../components/select/select'
import { Textarea } from '../components/textarea/textarea'
import { editableControlStyles } from './editableControl.styles'

function expectStyleClasses(element: Element, className: string | undefined) {
  for (const atomicClassName of className?.split(' ') ?? []) {
    expect(element.className).toContain(atomicClassName)
  }
}

afterEach(cleanup)

describe('editable control focus', () => {
  it('applies one focus-visible treatment to standalone editable controls', () => {
    render(
      <>
        <Input aria-label="Input" />
        <Textarea aria-label="Textarea" />
        <Select.Root>
          <Select.Trigger aria-label="Select" />
        </Select.Root>
      </>,
    )
    const focusClassName = stylex.props(editableControlStyles.focusVisible).className

    expectStyleClasses(screen.getByRole('textbox', { name: 'Input' }), focusClassName)
    expectStyleClasses(screen.getByRole('textbox', { name: 'Textarea' }), focusClassName)
    expectStyleClasses(screen.getByRole('combobox', { name: 'Select' }), focusClassName)
  })
})
