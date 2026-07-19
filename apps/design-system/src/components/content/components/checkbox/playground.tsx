import { Checkbox, type CheckboxSize } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { checkboxItem } from "@/lib/registry";

export interface CheckboxPlaygroundState {
  size: CheckboxSize;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  readOnly: boolean;
  [key: string]: boolean | string;
}

const initialState: CheckboxPlaygroundState = {
  size: "m",
  checked: false,
  indeterminate: false,
  disabled: false,
  readOnly: false,
};

const controls = [
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["s", "m"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "checked", label: "Checked" },
  { kind: "boolean", key: "indeterminate", label: "Indeterminate" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "readOnly", label: "Read only" },
] as const satisfies readonly PlaygroundControl<CheckboxPlaygroundState>[];

export function serializeCheckboxPlayground(state: CheckboxPlaygroundState): string {
  const props = ['aria-label="Notifications"'];
  if (state.size !== "m") props.push(`size="${state.size}"`);
  if (state.checked === true) props.push("checked");
  if (state.indeterminate === true) props.push("indeterminate");
  if (state.disabled === true) props.push("disabled");
  if (state.readOnly === true) props.push("readOnly");
  return createPlaygroundSource({
    imports: { Checkbox: true },
    example: `<Checkbox ${props.join(" ")} />`,
  });
}

export function CheckboxPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<CheckboxPlaygroundState>(initialState);
  const controlsPane = (
    <PlaygroundControls
      controls={controls}
      state={state}
      onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
      onReset={() => setState(initialState)}
    />
  );

  return (
    <ComponentDocsPage
      title={checkboxItem.title}
      description={checkboxItem.description}
      source={checkboxItem.source}
      preview={<Checkbox aria-label="Notifications" {...state} />}
      sourceCode={serializeCheckboxPlayground(state)}
      controls={controlsPane}
    >
      {children}
    </ComponentDocsPage>
  );
}
