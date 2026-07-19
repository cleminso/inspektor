import { Box, Search, type InputSize } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { searchItem } from "@/lib/registry";

export interface SearchPlaygroundState {
  size: InputSize;
  fullWidth: boolean;
  disabled: boolean;
  [key: string]: boolean | string;
}

const initialState: SearchPlaygroundState = { size: "m", fullWidth: true, disabled: false };

const controls = [
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["s", "m", "l"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "fullWidth", label: "Full width" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
] as const satisfies readonly PlaygroundControl<SearchPlaygroundState>[];

export function serializeSearchPlayground(state: SearchPlaygroundState): string {
  const props = ['aria-label="Search tables"', 'placeholder="Search tables"'];
  if (state.size !== "m") props.push(`size="${state.size}"`);
  if (state.fullWidth === false) props.push("fullWidth={false}");
  if (state.disabled === true) props.push("disabled");
  return createPlaygroundSource({
    imports: { Search: true },
    example: `<Search ${props.join(" ")} />`,
  });
}

export function SearchPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<SearchPlaygroundState>(initialState);
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
      title={searchItem.title}
      description={searchItem.description}
      source={searchItem.source}
      preview={
        <Box width="popup-width-m">
          <Search aria-label="Search tables" placeholder="Search tables" {...state} />
        </Box>
      }
      sourceCode={serializeSearchPlayground(state)}
      controls={controlsPane}
    >
      {children}
    </ComponentDocsPage>
  );
}
