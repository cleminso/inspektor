import { SegmentedControl, Text, type SegmentedControlWidth } from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { segmentedControlItem } from "@/lib/registry";

interface SegmentedControlPlaygroundState {
  width: SegmentedControlWidth;
  [key: string]: string;
}

const initialState: SegmentedControlPlaygroundState = {
  width: "full",
};

const controls = [
  {
    kind: "select",
    key: "width",
    label: "Width",
    options: ["content", "full"].map((value) => ({ label: value, value })),
  },
] as const satisfies readonly PlaygroundControl<SegmentedControlPlaygroundState>[];

function Preview({ width }: SegmentedControlPlaygroundState): ReactElement {
  return (
    <SegmentedControl defaultValue="details">
      <SegmentedControl.List aria-label="Row representation" width={width}>
        <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
        <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
      </SegmentedControl.List>
      <SegmentedControl.Panel value="details">
        <Text>Details view</Text>
      </SegmentedControl.Panel>
      <SegmentedControl.Panel value="json">
        <Text>JSON view</Text>
      </SegmentedControl.Panel>
    </SegmentedControl>
  );
}

function serializeSegmentedControlPlayground(state: SegmentedControlPlaygroundState): string {
  const width = state.width === "content" ? "" : ' width="full"';
  return createPlaygroundSource({
    imports: { SegmentedControl: true },
    example: `(
    <SegmentedControl defaultValue="details">
      <SegmentedControl.List aria-label="Row representation"${width}>
        <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
        <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
      </SegmentedControl.List>
      <SegmentedControl.Panel value="details">Details view</SegmentedControl.Panel>
      <SegmentedControl.Panel value="json">JSON view</SegmentedControl.Panel>
    </SegmentedControl>
  )`,
  });
}

export function SegmentedControlPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<SegmentedControlPlaygroundState>(initialState);

  return (
    <ComponentDocsPage
      title={segmentedControlItem.title}
      description={segmentedControlItem.description}
      source={segmentedControlItem.source}
      preview={<Preview {...state} />}
      sourceCode={serializeSegmentedControlPlayground(state)}
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
