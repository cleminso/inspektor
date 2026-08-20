import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import ComposedTriggerExample from "./composedTriggerExample";
import composedTriggerSource from "./composedTriggerExample.tsx?raw";
import InlineExample from "./inlineExample";
import inlineSource from "./inlineExample.tsx?raw";
import { DatePickerPlayground } from "./playground";
import {
  datePickerContentPropNames,
  datePickerPanelPropNames,
  datePickerRootPropNames,
  datePickerTriggerPropNames,
} from "./props";

const rootProps = getGeneratedProps("datePicker.root", datePickerRootPropNames);
const triggerProps = getGeneratedProps("datePicker.trigger", datePickerTriggerPropNames);
const contentProps = getGeneratedProps("datePicker.content", datePickerContentPropNames);
const panelProps = getGeneratedProps("datePicker.panel", datePickerPanelPropNames);

export function DatePickerPage(): ReactElement {
  return (
    <DatePickerPlayground>
      <Section title="Timestamp field" description="Use the default input-styled trigger in forms.">
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Composed trigger"
        description="Compose DatePicker trigger behavior onto another design-system button for cells and compact surfaces."
      >
        <Example source={composedTriggerSource}>
          <ComposedTriggerExample />
        </Example>
      </Section>
      <Section
        title="Inline step"
        description="Render the timestamp-selection panel inline when it is one stage inside another modal flow."
      >
        <Example source={inlineSource}>
          <InlineExample />
        </Example>
      </Section>
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section title="Panel props">
        <PropsTable rows={panelProps} />
      </Section>
    </DatePickerPlayground>
  );
}
