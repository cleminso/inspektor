import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { type ComponentRef, forwardRef } from "react";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { fieldsetStyles } from "./fieldset.styles";

export interface FieldsetRootProps extends Omit<
  BaseFieldset.Root.Props,
  "className" | "render" | "style"
> {
  /** Disables every form control in the fieldset. */
  disabled?: BaseFieldset.Root.Props["disabled"];
}

export interface FieldsetLegendProps extends Omit<
  BaseFieldset.Legend.Props,
  "className" | "style"
> {
  /** Composes Fieldset.Legend behavior and styles onto another element. */
  render?: BaseFieldset.Legend.Props["render"];
}

const FieldsetRoot = forwardRef<ComponentRef<typeof BaseFieldset.Root>, FieldsetRootProps>(
  function FieldsetRoot({ disabled = false, ...props }, forwardedRef) {
    const stateStyleProps = createStateStyleProps<BaseFieldset.Root.State>((state) => [
      fieldsetStyles.root,
      state.disabled === true && fieldsetStyles.rootDisabled,
    ]);

    return (
      <BaseFieldset.Root
        {...props}
        ref={forwardedRef}
        disabled={disabled}
        {...stateStyleProps}
        data-slot="fieldset"
      />
    );
  },
);

const FieldsetLegend = forwardRef<ComponentRef<typeof BaseFieldset.Legend>, FieldsetLegendProps>(
  function FieldsetLegend(props, forwardedRef) {
    const stateStyleProps = createStateStyleProps<BaseFieldset.Legend.State>((state) => [
      fieldsetStyles.legend,
      state.disabled === true && fieldsetStyles.disabled,
      state.disabled === true && fieldsetStyles.legendDisabled,
    ]);

    return (
      <BaseFieldset.Legend
        {...props}
        ref={forwardedRef}
        className={stateStyleProps.className}
        style={stateStyleProps.style}
        data-slot="fieldset-legend"
      />
    );
  },
);

export const Fieldset = Object.assign(FieldsetRoot, {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
});
