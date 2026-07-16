import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { selectItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import {
  selectIndicatorPropNames,
  selectItemPropNames,
  selectPositionerPropNames,
  selectRootPropNames,
  selectTriggerPropNames,
} from "./props";
import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";

const rootProps = getGeneratedProps("select.root", selectRootPropNames);
const triggerProps = getGeneratedProps("select.trigger", selectTriggerPropNames);
const positionerProps = getGeneratedProps("select.positioner", selectPositionerPropNames);
const itemProps = getGeneratedProps("select.item", selectItemPropNames);
const indicatorProps = getGeneratedProps("select.itemIndicator", selectIndicatorPropNames);

export function SelectPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader title={selectItem.title} description={selectItem.description} source={selectItem.source} />
      <Section title="Selection" description="Use Select for compact collections that do not require filtering.">
        <Example source={basicSource}><BasicExample /></Example>
      </Section>
      <Section title="Sizes" description="Match the trigger size to adjacent controls.">
        <Example source={sizesSource}><SizesExample /></Example>
      </Section>
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Trigger props"><PropsTable rows={triggerProps} /></Section>
      <Section title="Positioner props"><PropsTable rows={positionerProps} /></Section>
      <Section title="Item props"><PropsTable rows={itemProps} /></Section>
      <Section title="Item indicator props"><PropsTable rows={indicatorProps} /></Section>
    </DocsPage>
  );
}
