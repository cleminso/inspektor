import { Form as BaseForm } from "@base-ui/react/form";
import * as stylex from "@stylexjs/stylex";

import { formStyles } from "./form.styles";

export interface FormProps<FormValues extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<BaseForm.Props<FormValues>, "className" | "style"> {
  /** Selects when fields in the form are validated. */
  validationMode?: BaseForm.Props<FormValues>["validationMode"];
  /** Supplies external validation errors keyed by Field.Root name. */
  errors?: BaseForm.Props<FormValues>["errors"];
  /** Receives consolidated field values after successful validation. */
  onFormSubmit?: BaseForm.Props<FormValues>["onFormSubmit"];
  /** Provides access to imperative form validation. */
  actionsRef?: BaseForm.Props<FormValues>["actionsRef"];
  /** Handles the native submit event after successful validation. */
  onSubmit?: BaseForm.Props<FormValues>["onSubmit"];
  /** Selects a URL or function that handles form submission. */
  action?: BaseForm.Props<FormValues>["action"];
  /** Composes Form behavior and styles onto another form element. */
  render?: BaseForm.Props<FormValues>["render"];
}

export function Form<FormValues extends Record<string, unknown> = Record<string, unknown>>({
  validationMode = "onSubmit",
  ...props
}: FormProps<FormValues>) {
  return (
    <BaseForm<FormValues>
      {...props}
      validationMode={validationMode}
      className={stylex.props(formStyles.root).className}
      style={stylex.props(formStyles.root).style}
      data-slot="form"
    />
  );
}
