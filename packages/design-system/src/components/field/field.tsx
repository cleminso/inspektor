import { Field as BaseField } from "@base-ui/react/field";
import { type ComponentRef, forwardRef } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { FieldContext } from "./fieldContext";
import { fieldStyles } from "./field.styles";

export interface FieldRootProps extends Omit<
  BaseField.Root.Props,
  "className" | "render" | "style"
> {
  /** Disables the field and its control. */
  disabled?: BaseField.Root.Props["disabled"];
  /** Identifies the field when a form is submitted. */
  name?: BaseField.Root.Props["name"];
  /** Controls invalid state from an external form library. */
  invalid?: BaseField.Root.Props["invalid"];
  /** Controls dirty state from an external form library. */
  dirty?: BaseField.Root.Props["dirty"];
  /** Controls touched state from an external form library. */
  touched?: BaseField.Root.Props["touched"];
  /** Validates the field value and returns validation messages. */
  validate?: BaseField.Root.Props["validate"];
  /** Selects when field validation runs. */
  validationMode?: BaseField.Root.Props["validationMode"];
  /** Delays validation while using change validation. */
  validationDebounceTime?: BaseField.Root.Props["validationDebounceTime"];
  /** Provides access to imperative field actions. */
  actionsRef?: BaseField.Root.Props["actionsRef"];
  /** Composes the field root onto a design-system structural element. */
  render?: BaseField.Root.Props["render"];
}

export interface FieldLabelProps extends Omit<BaseField.Label.Props, "className" | "style"> {
  /** Indicates whether the rendered element uses native label behavior. */
  nativeLabel?: BaseField.Label.Props["nativeLabel"];
  /** Composes Field.Label behavior and styles onto another element. */
  render?: BaseField.Label.Props["render"];
}

export interface FieldDescriptionProps extends Omit<
  BaseField.Description.Props,
  "className" | "style"
> {
  /** Composes Field.Description behavior and styles onto another element. */
  render?: BaseField.Description.Props["render"];
}

export interface FieldErrorProps extends Omit<BaseField.Error.Props, "className" | "style"> {
  /** Selects the validity condition that displays the error. Use true for externally controlled errors. */
  match?: BaseField.Error.Props["match"];
  /** Composes Field.Error behavior and styles onto another element. */
  render?: BaseField.Error.Props["render"];
}

const FieldRoot = forwardRef<ComponentRef<typeof BaseField.Root>, FieldRootProps>(
  function FieldRoot({ disabled = false, ...props }, forwardedRef) {
    const stateStyleProps = createStateStyleProps<BaseField.Root.State>((state) => [
      fieldStyles.root,
      state.valid === false && fieldStyles.inputGroupInvalid,
      state.disabled === true && fieldStyles.inputGroupDisabled,
    ]);

    return (
      <FieldContext.Provider value={{ disabled }}>
        <BaseField.Root
          {...props}
          ref={forwardedRef}
          disabled={disabled}
          className={stateStyleProps.className}
          style={stateStyleProps.style}
          data-slot="field"
        />
      </FieldContext.Provider>
    );
  },
);

const FieldLabel = forwardRef<ComponentRef<typeof BaseField.Label>, FieldLabelProps>(
  function FieldLabel({ nativeLabel = true, ...props }, forwardedRef) {
    const stateStyleProps = createStateStyleProps<BaseField.Label.State>((state) => [
      fieldStyles.label,
      state.disabled === true && fieldStyles.disabled,
    ]);

    return (
      <BaseField.Label
        {...props}
        ref={forwardedRef}
        nativeLabel={nativeLabel}
        className={stateStyleProps.className}
        style={stateStyleProps.style}
        data-slot="field-label"
      />
    );
  },
);

const FieldDescription = forwardRef<
  ComponentRef<typeof BaseField.Description>,
  FieldDescriptionProps
>(function FieldDescription(props, forwardedRef) {
  const stateStyleProps = createStateStyleProps<BaseField.Description.State>((state) => [
    fieldStyles.message,
    fieldStyles.description,
    state.disabled === true && fieldStyles.disabled,
  ]);

  return (
    <BaseField.Description
      {...props}
      ref={forwardedRef}
      className={stateStyleProps.className}
      style={stateStyleProps.style}
      data-slot="field-description"
    />
  );
});

const FieldError = forwardRef<ComponentRef<typeof BaseField.Error>, FieldErrorProps>(
  function FieldError(props, forwardedRef) {
    const stateStyleProps = createStateStyleProps<BaseField.Error.State>((state) => [
      fieldStyles.message,
      fieldStyles.error,
      state.disabled === true && fieldStyles.disabled,
    ]);

    return (
      <BaseField.Error
        {...props}
        ref={forwardedRef}
        className={stateStyleProps.className}
        style={stateStyleProps.style}
        data-slot="field-error"
      />
    );
  },
);

export const Field = Object.assign(FieldRoot, {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
});
