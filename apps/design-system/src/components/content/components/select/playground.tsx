import { Box, Select, type SelectSize, type SelectWidth } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { selectItem } from "@/lib/registry";

export interface SelectPlaygroundState {
  size: SelectSize;
  itemSize: SelectSize;
  width: SelectWidth;
  disabled: boolean;
  prefix: boolean;
  suffix: boolean;
  [key: string]: boolean | string;
}

const initialState: SelectPlaygroundState = {
  size: "m",
  itemSize: "s",
  width: "content",
  disabled: false,
  prefix: false,
  suffix: false,
};

const options = [
  { label: "Main", value: "main" },
  { label: "Develop", value: "develop" },
  { label: "Schema preview", value: "schema-preview" },
];

const controls = [
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["s", "m", "l"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "width",
    label: "Width",
    options: ["content", "full"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "itemSize",
    label: "Item size",
    options: ["s", "m", "l"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "prefix", label: "Prefix" },
  { kind: "boolean", key: "suffix", label: "Suffix" },
] as const satisfies readonly PlaygroundControl<SelectPlaygroundState>[];

export function serializeSelectPlayground(state: SelectPlaygroundState): string {
  const rootProps = ["items={options}", 'defaultValue="main"'];
  const triggerProps = ['aria-label="Branch"'];
  const itemProps = ['key={option.value}', 'value={option.value}'];
  if (state.disabled === true) rootProps.push("disabled");
  if (state.size !== "m") triggerProps.push(`size="${state.size}"`);
  if (state.width !== "content") triggerProps.push(`width="${state.width}"`);
  if (state.prefix === true) triggerProps.push('prefix="Branch"');
  if (state.suffix === true) triggerProps.push('suffix="Active"');
  if (state.itemSize !== "s") itemProps.push(`size="${state.itemSize}"`);

  return createPlaygroundSource({
    imports: { Select: true },
    declarations: `const options = [
  { label: "Main", value: "main" },
  { label: "Develop", value: "develop" },
  { label: "Schema preview", value: "schema-preview" },
];`,
    example: `(
    <Select.Root ${rootProps.join(" ")}>
      <Select.Trigger ${triggerProps.join(" ")}>
        <Select.Value placeholder="Select a branch" />
      </Select.Trigger>
      <Select.Content>
        {options.map((option) => (
          <Select.Item ${itemProps.join(" ")}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )`,
  });
}

export function SelectPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<SelectPlaygroundState>(initialState);
  const preview = (
    <Box>
      <Select.Root items={options} defaultValue="main" disabled={state.disabled}>
        <Select.Trigger
          aria-label="Branch"
          size={state.size}
          width={state.width}
          prefix={state.prefix === true ? "Branch" : undefined}
          suffix={state.suffix === true ? "Active" : undefined}
        >
          <Select.Value placeholder="Select a branch" />
        </Select.Trigger>
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value} size={state.itemSize}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Box>
  );

  return (
    <ComponentDocsPage
      title={selectItem.title}
      description={selectItem.description}
      source={selectItem.source}
      preview={preview}
      sourceCode={serializeSelectPlayground(state)}
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
