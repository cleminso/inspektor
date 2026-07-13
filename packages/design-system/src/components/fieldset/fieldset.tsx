import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import * as stylex from "@stylexjs/stylex";

import { createStateStyleProps } from "../../primitives/createStateStyleProps";
import { fieldsetStyles } from "./fieldset.styles";

export interface FieldsetRootProps
  extends Omit<BaseFieldset.Root.Props, "className" | "style"> {
  /** Disables every form control in the fieldset. */
  disabled?: BaseFieldset.Root.Props["disabled"];
  /** Composes Fieldset.Root behavior and styles onto another element. */
  render?: BaseFieldset.Root.Props["render"];
}

export interface FieldsetLegendProps
  extends Omit<BaseFieldset.Legend.Props, "className" | "style"> {
  /** Composes Fieldset.Legend behavior and styles onto another element. */
  render?: BaseFieldset.Legend.Props["render"];
}

function FieldsetRoot({ disabled = false, ...props }: FieldsetRootProps) {
  return (
    <BaseFieldset.Root
      {...props}
      disabled={disabled}
      className={stylex.props(fieldsetStyles.root).className}
      style={stylex.props(fieldsetStyles.root).style}
      data-slot="fieldset"
    />
  );
}

function FieldsetLegend(props: FieldsetLegendProps) {
  const stateStyleProps = createStateStyleProps<BaseFieldset.Legend.State>((state) => [
    fieldsetStyles.legend,
    state.disabled === true && fieldsetStyles.disabled,
  ]);

  return (
    <BaseFieldset.Legend
      {...props}
      className={stateStyleProps.className}
      style={stateStyleProps.style}
      data-slot="fieldset-legend"
    />
  );
}

export const Fieldset = Object.assign(FieldsetRoot, {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
});
