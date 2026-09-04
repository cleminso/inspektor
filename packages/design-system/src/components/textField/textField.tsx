import type { ReactNode } from 'react'

import { Field } from '../field/field'
import type { FieldRootProps } from '../field/field'
import { Input } from '../input/input'
import type { InputProps } from '../input/input'

export interface TextFieldProps extends Omit<
  InputProps,
  'disabled' | 'fullWidth' | 'name' | 'render'
> {
  /** Provides the input's accessible label. */
  label: ReactNode
  /** Provides supporting information associated with the input. */
  description?: ReactNode
  /** Displays an externally controlled error message. */
  error?: ReactNode
  /** Identifies the field during form submission. */
  name?: FieldRootProps['name']
  /** Disables the field and input. */
  disabled?: FieldRootProps['disabled']
  /** Controls invalid state from an external form library. */
  invalid?: FieldRootProps['invalid']
  /** Validates the input value and returns validation messages. */
  validate?: FieldRootProps['validate']
  /** Selects when field validation runs. */
  validationMode?: FieldRootProps['validationMode']
  /** Delays validation while using change validation. */
  validationDebounceTime?: FieldRootProps['validationDebounceTime']
  /** Stretches the input to the width of its container. */
  fullWidth?: boolean
}

/**
 * Composes Field and Input for conventional labeled text entry. Use the separate
 * components when a field needs additional controls or a different structure.
 */
export function TextField({
  label,
  description,
  error,
  name,
  disabled = false,
  invalid,
  validate,
  validationMode = 'onBlur',
  validationDebounceTime,
  fullWidth = true,
  ...inputProps
}: TextFieldProps) {
  const effectiveInvalid = invalid === true || error != null

  return (
    <Field.Root
      name={name}
      disabled={disabled}
      invalid={effectiveInvalid}
      validate={validate}
      validationMode={validationMode}
      validationDebounceTime={validationDebounceTime}
    >
      <Field.Label>{label}</Field.Label>
      <Input
        {...inputProps}
        invalid={effectiveInvalid}
        fullWidth={fullWidth}
      />
      {description === undefined ? null : <Field.Description>{description}</Field.Description>}
      {error == null ? <Field.Error /> : <Field.Error match>{error}</Field.Error>}
    </Field.Root>
  )
}
