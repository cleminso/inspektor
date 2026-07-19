import { Box, Input, type InputSize } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { inputItem } from "@/lib/registry";

export interface InputPlaygroundState {
  size: InputSize;
  fullWidth: boolean;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  [key: string]: boolean | string;
}

const initialState: InputPlaygroundState = {
  size: "m",
  fullWidth: false,
  invalid: false,
  disabled: false,
  readOnly: false,
};

const controls = [
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["s", "m", "l"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "fullWidth", label: "Full width" },
  { kind: "boolean", key: "invalid", label: "Invalid" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "readOnly", label: "Read only" },
] as const satisfies readonly PlaygroundControl<InputPlaygroundState>[];

export function serializeInputPlayground(state: InputPlaygroundState): string {
  const props = ['aria-label="Email"', 'placeholder="name@example.com"'];
  if (state.size !== "m") props.push(`size="${state.size}"`);
  if (state.fullWidth === true) props.push("fullWidth");
  if (state.invalid === true) props.push("invalid");
  if (state.disabled === true) props.push("disabled");
  if (state.readOnly === true) props.push("readOnly");
  return createPlaygroundSource({
    imports: { Input: true },
    example: `<Input ${props.join(" ")} />`,
  });
}

export function InputPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<InputPlaygroundState>(initialState);
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
      title={inputItem.title}
      description={inputItem.description}
      source={inputItem.source}
      preview={
        <Box>
          <Input aria-label="Email" placeholder="name@example.com" {...state} />
        </Box>
      }
      sourceCode={serializeInputPlayground(state)}
      controls={controlsPane}
    >
      {children}
    </ComponentDocsPage>
  );
}
