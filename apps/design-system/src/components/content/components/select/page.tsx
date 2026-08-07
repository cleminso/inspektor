import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import DefaultOptionsExample from "./defaultOptionsExample";
import defaultOptionsSource from "./defaultOptionsExample.tsx?raw";
import DisabledExample from "./disabledExample";
import disabledSource from "./disabledExample.tsx?raw";
import LabelExample from "./labelExample";
import labelSource from "./labelExample.tsx?raw";
import { SelectPlayground } from "./playground";
import {
  selectItemPropNames,
  selectRootPropNames,
  selectTriggerPropNames,
} from "./props";
import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";
import WidthsExample from "./widthsExample";
import widthsSource from "./widthsExample.tsx?raw";

const rootProps = getGeneratedProps("select.root", selectRootPropNames);
const triggerProps = getGeneratedProps("select.trigger", selectTriggerPropNames);
const itemProps = getGeneratedProps("select.item", selectItemPropNames);

export function SelectPage(): ReactElement {
  return (
    <SelectPlayground>
      <Section
        title="Default options"
        description="Use Select for compact collections that do not require filtering."
      >
        <Example source={defaultOptionsSource}>
          <DefaultOptionsExample />
        </Example>
      </Section>
      <Section title="Sizes" description="Match the trigger size to adjacent controls.">
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>
      <Section
        title="Widths"
        description="Use content width for intrinsic labels, compact width to reserve a stable short-control footprint, and full width in form layouts."
      >
        <Example source={widthsSource}>
          <WidthsExample />
        </Example>
      </Section>
      <Section
        title="Disabled"
        description="Disable the full control or individual unavailable options."
      >
        <Example source={disabledSource}>
          <DisabledExample />
        </Example>
      </Section>
      <Section title="Label" description="Use Select.Label to provide an accessible visible name.">
        <Example source={labelSource}>
          <LabelExample />
        </Example>
      </Section>
      <Section
        title="Root props"
        description="Invalid state remains in the API metadata rather than a dedicated visual example."
      >
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
    </SelectPlayground>
  );
}
