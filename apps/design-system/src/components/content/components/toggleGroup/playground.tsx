import {
  Box,
  ToggleGroup,
  type ToggleGroupItemWidth,
  type ToggleGroupOrientation,
  type ToggleGroupSize,
  type ToggleGroupWidth,
} from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { toggleGroupItem } from "@/lib/registry";

export interface ToggleGroupPlaygroundState {
  orientation: ToggleGroupOrientation;
  size: ToggleGroupSize;
  width: ToggleGroupWidth;
  itemWidth: ToggleGroupItemWidth;
  multiple: boolean;
  disabled: boolean;
  loopFocus: boolean;
  [key: string]: boolean | string;
}

const initialState: ToggleGroupPlaygroundState = {
  orientation: "horizontal",
  size: "l",
  width: "content",
  itemWidth: "content",
  multiple: false,
  disabled: false,
  loopFocus: true,
};

const controls = [
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["s", "m", "l"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "orientation",
    label: "Orientation",
    options: ["horizontal", "vertical"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "width",
    label: "Width",
    options: ["content", "full"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "itemWidth",
    label: "Item width",
    options: ["content", "equal"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "multiple", label: "Multiple" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "loopFocus", label: "Loop focus" },
] as const satisfies readonly PlaygroundControl<ToggleGroupPlaygroundState>[];

export function serializeToggleGroupPlayground(state: ToggleGroupPlaygroundState): string {
  const props = [
    `defaultValue={[${state.multiple === true ? '"tables", "subscriptions"' : '"tables"'}]}`,
    state.orientation !== "horizontal" ? `orientation="${state.orientation}"` : null,
    state.size !== "l" ? `size="${state.size}"` : null,
    state.width !== "content" ? `width="${state.width}"` : null,
    state.itemWidth !== "content" ? `itemWidth="${state.itemWidth}"` : null,
    state.multiple === true ? "multiple" : null,
    state.disabled === true ? "disabled" : null,
    state.loopFocus === false ? "loopFocus={false}" : null,
    'aria-label="Data view"',
  ].filter((prop): prop is string => prop !== null);

  return createPlaygroundSource({
    imports: { ToggleGroup: true },
    example: `(\n    <ToggleGroup\n      ${props.join("\n      ")}\n    >\n      <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>\n      <ToggleGroup.Item value="subscriptions">Subscriptions</ToggleGroup.Item>\n    </ToggleGroup>\n  )`,
  });
}

export function ToggleGroupPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<ToggleGroupPlaygroundState>(initialState);
  const [value, setValue] = useState<string[]>(["tables"]);
  const preview = (
    <Box width="popup-width-m">
      <ToggleGroup
        value={value}
        onValueChange={(nextValue) => setValue([...nextValue])}
        orientation={state.orientation}
        size={state.size}
        width={state.width}
        itemWidth={state.itemWidth}
        multiple={state.multiple}
        disabled={state.disabled}
        loopFocus={state.loopFocus}
        aria-label="Data view"
      >
        <ToggleGroup.Item value="tables">Tables</ToggleGroup.Item>
        <ToggleGroup.Item value="subscriptions">Subscriptions</ToggleGroup.Item>
      </ToggleGroup>
    </Box>
  );

  return (
    <ComponentDocsPage
      title={toggleGroupItem.title}
      description={toggleGroupItem.description}
      source={toggleGroupItem.source}
      preview={preview}
      sourceCode={serializeToggleGroupPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, nextValue) => {
            setState((current) => ({ ...current, [key]: nextValue }));
            if (key === "multiple") {
              setValue(nextValue === true ? ["tables", "subscriptions"] : ["tables"]);
            }
          }}
          onReset={() => {
            setState(initialState);
            setValue(["tables"]);
          }}
        />
      }
    >
      {children}
    </ComponentDocsPage>
  );
}
