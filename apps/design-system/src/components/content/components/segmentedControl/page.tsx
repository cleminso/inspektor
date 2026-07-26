import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { SegmentedControlPlayground } from "./playground";
import {
  segmentedControlItemPropNames,
  segmentedControlListPropNames,
  segmentedControlPanelPropNames,
  segmentedControlRootPropNames,
} from "./props";

const rootProps = getGeneratedProps("segmentedControl.root", segmentedControlRootPropNames);
const listProps = getGeneratedProps("segmentedControl.list", segmentedControlListPropNames);
const itemProps = getGeneratedProps("segmentedControl.item", segmentedControlItemPropNames);
const panelProps = getGeneratedProps("segmentedControl.panel", segmentedControlPanelPropNames);

export function SegmentedControlPage(): ReactElement {
  return (
    <SegmentedControlPlayground>
      <Section
        title="Motion and continuity"
        description="Use Segmented Control when each segment changes the view of one persistent object. The moving selection indicator communicates that continuity; panel content changes immediately and does not animate. Use navigation or Toggle Group when options lead to different resources, areas, or independent pressed states."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="List props">
        <PropsTable rows={listProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Panel props">
        <PropsTable rows={panelProps} />
      </Section>
    </SegmentedControlPlayground>
  );
}
