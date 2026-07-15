import { Box } from "@inspector/ds";
import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { resizablePanelItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import CollapsibleExample from "./collapsibleExample";
import collapsibleSource from "./collapsibleExample.tsx?raw";
import {
  resizableHandlePropNames,
  resizablePanelGroupPropNames,
  resizablePanelPropNames,
} from "./props";

const groupProps = getGeneratedProps("resizablePanelGroup", resizablePanelGroupPropNames);
const panelProps = getGeneratedProps("resizablePanel", resizablePanelPropNames);
const handleProps = getGeneratedProps("resizableHandle", resizableHandlePropNames);

export function ResizablePanelPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={resizablePanelItem.title}
        description={resizablePanelItem.description}
        source={resizablePanelItem.source}
      />

      <Section
        title="Split layout"
        description="Combine pixel-sized side panels with a flexible center panel. Handles support keyboard and pointer resizing."
      >
        <Example source={basicSource} align="stretch">
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Collapsible panel"
        description="Use the panel ref for explicit collapse controls while onResize keeps application state synchronized."
      >
        <Example source={collapsibleSource} align="stretch">
          <CollapsibleExample />
        </Example>
      </Section>

      <Section title="Panel group props">
        <PropsTable rows={groupProps} />
      </Section>
      <Section title="Panel props">
        <PropsTable rows={panelProps} />
      </Section>
      <Section title="Handle props">
        <PropsTable rows={handleProps} />
      </Section>
    </Box>
  );
}
