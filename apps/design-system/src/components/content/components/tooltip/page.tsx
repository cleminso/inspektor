import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { tooltipItem } from "@/lib/registry";

import CellValueExample from "./cellValueExample";
import cellValueSource from "./cellValueExample.tsx?raw";
import PositionExample from "./positionExample";
import positionSource from "./positionExample.tsx?raw";
import {
  tooltipContentPropNames,
  tooltipProviderPropNames,
  tooltipRootPropNames,
  tooltipTriggerPropNames,
} from "./props";

const providerProps = getGeneratedProps("tooltip.provider", tooltipProviderPropNames);
const rootProps = getGeneratedProps("tooltip.root", tooltipRootPropNames);
const triggerProps = getGeneratedProps("tooltip.trigger", tooltipTriggerPropNames);
const contentProps = getGeneratedProps("tooltip.content", tooltipContentPropNames);

export function TooltipPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={tooltipItem.title}
        description={tooltipItem.description}
        source={tooltipItem.source}
      />
      <Section
        title="Cell value"
        description="Use a tooltip to reveal supplementary, non-interactive content such as a truncated identifier."
      >
        <Example source={cellValueSource}><CellValueExample /></Example>
      </Section>
      <Section title="Position" description="Content owns its portal, positioning, popup, and arrow.">
        <Example source={positionSource}><PositionExample /></Example>
      </Section>
      <Section title="Provider props"><PropsTable rows={providerProps} /></Section>
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Trigger props"><PropsTable rows={triggerProps} /></Section>
      <Section title="Content props"><PropsTable rows={contentProps} /></Section>
    </DocsPage>
  );
}
