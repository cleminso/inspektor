import {
  Button,
  ButtonGroup,
  type ButtonGroupOrientation,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { buttonGroupItem } from "@/lib/registry";

export interface ButtonGroupPlaygroundState {
  orientation: ButtonGroupOrientation;
  separator: boolean;
  text: boolean;
  [key: string]: boolean | string;
}

const initialState: ButtonGroupPlaygroundState = {
  orientation: "horizontal",
  separator: false,
  text: false,
};

const controls = [
  {
    kind: "select",
    key: "orientation",
    label: "Orientation",
    options: ["horizontal", "vertical"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "separator", label: "Separator" },
  { kind: "boolean", key: "text", label: "Text label" },
] as const satisfies readonly PlaygroundControl<ButtonGroupPlaygroundState>[];

export function serializeButtonGroupPlayground(state: ButtonGroupPlaygroundState): string {
  const orientation = state.orientation === "vertical" ? ' orientation="vertical"' : "";
  const separatorOrientation = state.orientation === "horizontal" ? "vertical" : "horizontal";
  const items = [
    state.text === true ? "      <ButtonGroupText>Document</ButtonGroupText>" : null,
    '      <Button variant="outline">Archive</Button>',
    state.separator === true
      ? `      <ButtonGroupSeparator orientation="${separatorOrientation}" />`
      : null,
    '      <Button variant="outline">Report</Button>',
  ].filter((line): line is string => line !== null);

  return createPlaygroundSource({
    imports: {
      Button: true,
      ButtonGroup: true,
      ButtonGroupSeparator: state.separator,
      ButtonGroupText: state.text,
    },
    example: `(\n    <ButtonGroup${orientation} aria-label="Document actions">\n${items.join("\n")}\n    </ButtonGroup>\n  )`,
  });
}

export function ButtonGroupPreview({ state }: { state: ButtonGroupPlaygroundState }): ReactElement {
  const separatorOrientation = state.orientation === "horizontal" ? "vertical" : "horizontal";

  return (
    <ButtonGroup orientation={state.orientation} aria-label="Document actions">
      {state.text === true ? <ButtonGroupText>Document</ButtonGroupText> : null}
      <Button variant="outline">Archive</Button>
      {state.separator === true ? (
        <ButtonGroupSeparator orientation={separatorOrientation} />
      ) : null}
      <Button variant="outline">Report</Button>
    </ButtonGroup>
  );
}

export function ButtonGroupPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<ButtonGroupPlaygroundState>(initialState);
  const preview = <ButtonGroupPreview state={state} />;

  return (
    <ComponentDocsPage
      title={buttonGroupItem.title}
      description={buttonGroupItem.description}
      source={buttonGroupItem.source}
      preview={preview}
      sourceCode={serializeButtonGroupPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
          onReset={() => setState(initialState)}
        />
      }
    >
      {children}
    </ComponentDocsPage>
  );
}
