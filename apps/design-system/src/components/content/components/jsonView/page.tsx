import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import CollapsedRootExample from "./collapsedRootExample";
import collapsedRootSource from "./collapsedRootExample.tsx?raw";
import DefaultExpansionExample from "./defaultExpansionExample";
import defaultExpansionSource from "./defaultExpansionExample.tsx?raw";
import EmptyValuesExample from "./emptyValuesExample";
import emptyValuesSource from "./emptyValuesExample.tsx?raw";
import LargeBranchExample from "./largeBranchExample";
import largeBranchSource from "./largeBranchExample.tsx?raw";
import LongContentExample from "./longContentExample";
import longContentSource from "./longContentExample.tsx?raw";
import { JsonViewPlayground } from "./playground";
import { jsonViewPropNames } from "./props";
import SearchHighlightingExample from "./searchHighlightingExample";
import searchHighlightingSource from "./searchHighlightingExample.tsx?raw";

const jsonViewProps = getGeneratedProps("jsonView", jsonViewPropNames);

export function JsonViewPage(): ReactElement {
  return (
    <JsonViewPlayground>
      <Section
        title="Nested data"
        description="Objects and arrays expand one container level by default. The root copy action remains available while disclosure controls and tree keyboard commands reveal deeper values."
      >
        <Example source={defaultExpansionSource} align="stretch">
          <DefaultExpansionExample />
        </Example>
      </Section>

      <Section
        title="Collapsed root"
        description="Set the initial depth to zero when the surrounding surface should reveal the payload on demand."
      >
        <Example source={collapsedRootSource} align="stretch">
          <CollapsedRootExample />
        </Example>
      </Section>

      <Section
        title="Empty and nullable values"
        description="Empty containers remain inline while null keeps its JSON primitive representation."
      >
        <Example source={emptyValuesSource} align="stretch">
          <EmptyValuesExample />
        </Example>
      </Section>

      <Section
        title="Search highlighting"
        description="Pass literal terms from an application-owned search control to highlight matching keys and primitive values."
      >
        <Example source={searchHighlightingSource} align="stretch">
          <SearchHighlightingExample />
        </Example>
      </Section>

      <Section
        title="Long and narrow content"
        description="Long strings wrap within narrow panes and expose a deliberate action when the display budget is reached."
      >
        <Example source={longContentSource} align="start">
          <LongContentExample />
        </Example>
      </Section>

      <Section
        title="Large branches"
        description="Large branches render in bounded batches. Continue through the branch with the Show more tree item."
      >
        <Example source={largeBranchSource} align="stretch">
          <LargeBranchExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={jsonViewProps} />
      </Section>
    </JsonViewPlayground>
  );
}
