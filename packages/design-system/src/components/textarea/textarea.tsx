import { Field as BaseField } from '@base-ui/react/field'
import { forwardRef, type ComponentPropsWithRef } from 'react'

import { createStateStyleProps } from '../../primitives/createStateStyleProps'
import { textareaStyles } from './textarea.styles'

export type TextareaHeight = 's' | 'm' | 'l'
export type TextareaFont = 'sans' | 'mono'

export interface TextareaProps extends Omit<
  ComponentPropsWithRef<'textarea'>,
  'className' | 'cols' | 'ref' | 'rows' | 'style'
> {
  /** Controls the minimum editor height. */
  height?: TextareaHeight
  /** Selects proportional or code-oriented typography. */
  font?: TextareaFont
  /** Stretches the textarea to the width of its container. */
  fullWidth?: boolean
  /** Marks the textarea as invalid and exposes that state to assistive technology. */
  invalid?: boolean
  /** Disables editing and focus. */
  disabled?: ComponentPropsWithRef<'textarea'>['disabled']
  /** Prevents editing while preserving focus and text selection. */
  readOnly?: ComponentPropsWithRef<'textarea'>['readOnly']
  /** Sets the initial value when uncontrolled. */
  defaultValue?: ComponentPropsWithRef<'textarea'>['defaultValue']
  /** Sets the current value when controlled. */
  value?: ComponentPropsWithRef<'textarea'>['value']
  /** Runs when the textarea value changes. */
  onValueChange?: BaseField.Control.Props['onValueChange']
}

const heightStyles = {
  s: textareaStyles.heightS,
  m: textareaStyles.heightM,
  l: textareaStyles.heightL,
} satisfies Record<TextareaHeight, unknown>

const fontStyles = {
  sans: textareaStyles.fontSans,
  mono: textareaStyles.fontMono,
} satisfies Record<TextareaFont, unknown>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    height = 'm',
    font = 'sans',
    fullWidth = true,
    invalid = false,
    disabled = false,
    readOnly = false,
    defaultValue,
    value,
    onValueChange,
    ...props
  },
  ref,
) {
  const controlProps = props as unknown as Omit<
    BaseField.Control.Props,
    'className' | 'defaultValue' | 'onValueChange' | 'readOnly' | 'render' | 'style' | 'value'
  >
  const stateStyleProps = createStateStyleProps<BaseField.Control.State>((state) => [
    textareaStyles.base,
    heightStyles[height],
    fontStyles[font],
    fullWidth === true && textareaStyles.fullWidth,
    state.disabled === true && textareaStyles.disabled,
    readOnly === true && textareaStyles.readOnly,
    (invalid === true || state.valid === false) && textareaStyles.invalid,
    state.valid === true && textareaStyles.valid,
    state.touched === true && textareaStyles.touched,
    state.dirty === true && textareaStyles.dirty,
    state.filled === true && textareaStyles.filled,
    state.focused === true && textareaStyles.focused,
  ])

  return (
    <BaseField.Control
      {...controlProps}
      render={<textarea ref={ref} />}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid === true ? true : props['aria-invalid']}
      {...stateStyleProps}
      data-slot="textarea"
      data-height={height}
      data-font={font}
    />
  )
})
