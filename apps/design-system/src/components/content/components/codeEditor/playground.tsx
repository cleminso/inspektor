import { Box, CodeEditor } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { codeEditorItem } from "@/lib/registry";

export interface CodeEditorPlaygroundState {
  expanded: boolean;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  [key: string]: boolean | string;
}

const initialSource = JSON.stringify(
  {
    account: { id: "account_01", role: "admin" },
    permissions: ["read", "write"],
  },
  null,
  2,
);

const initialState: CodeEditorPlaygroundState = {
  expanded: false,
  invalid: false,
  disabled: false,
  readOnly: false,
};

const controls = [
  { kind: "boolean", key: "expanded", label: "Expanded" },
  { kind: "boolean", key: "invalid", label: "Invalid" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "readOnly", label: "Read only" },
] as const satisfies readonly PlaygroundControl<CodeEditorPlaygroundState>[];

export function serializeCodeEditorPlayground(state: CodeEditorPlaygroundState): string {
  const props = [
    'accessibilityLabel="Account JSON"',
    "value={value}",
    "onValueChange={setValue}",
    state.expanded === true ? "expanded" : null,
    state.invalid === true ? "invalid" : null,
    state.disabled === true ? "disabled" : null,
    state.readOnly === true ? "readOnly" : null,
  ].filter((prop): prop is string => prop !== null);

  return `import { CodeEditor } from "@inspector/ds";
import { useState } from "react";

const initialValue = ${JSON.stringify(initialSource)};

export default function Example() {
  const [value, setValue] = useState(initialValue);

  return (
    <CodeEditor
      ${props.join("\n      ")}
    />
  );
}`;
}

export function CodeEditorPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<CodeEditorPlaygroundState>(initialState);
  const [value, setValue] = useState(initialSource);

  return (
    <ComponentDocsPage
      title={codeEditorItem.title}
      description={codeEditorItem.description}
      source={codeEditorItem.source}
      preview={
        <Box minWidth={0} width="popup-width-l">
          <CodeEditor
            accessibilityLabel="Account JSON"
            value={value}
            onValueChange={setValue}
            expanded={state.expanded}
            onExpandedChange={(expanded) => {
              setState((current) => ({ ...current, expanded }));
            }}
            invalid={state.invalid}
            disabled={state.disabled}
            readOnly={state.readOnly}
          />
        </Box>
      }
      sourceCode={serializeCodeEditorPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, nextValue) => {
            setState((current) => ({ ...current, [key]: nextValue }));
          }}
          onReset={() => {
            setState(initialState);
            setValue(initialSource);
          }}
        />
      }
    >
      {children}
    </ComponentDocsPage>
  );
}
