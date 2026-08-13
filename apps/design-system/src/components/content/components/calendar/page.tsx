import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import ComposedTriggerExample from "./composedTriggerExample";
import composedTriggerSource from "./composedTriggerExample.tsx?raw";
import { CalendarPlayground } from "./playground";
import {
  calendarContentPropNames,
  calendarRootPropNames,
  calendarTriggerPropNames,
} from "./props";

const rootProps = getGeneratedProps("calendar.root", calendarRootPropNames);
const triggerProps = getGeneratedProps("calendar.trigger", calendarTriggerPropNames);
const contentProps = getGeneratedProps("calendar.content", calendarContentPropNames);

export function CalendarPage(): ReactElement {
  return (
    <CalendarPlayground>
      <Section title="Timestamp field" description="Use the default input-styled trigger in forms.">
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Composed trigger"
        description="Compose Calendar trigger behavior onto another design-system button for cells and compact surfaces."
      >
        <Example source={composedTriggerSource}>
          <ComposedTriggerExample />
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
    </CalendarPlayground>
  );
}
