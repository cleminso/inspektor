import { Box } from "@inspector/ds";
import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { fieldsetItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import DisabledExample from "./disabledExample";
import disabledSource from "./disabledExample.tsx?raw";
import { fieldsetLegendPropNames, fieldsetRootPropNames } from "./props";

const rootProps = getGeneratedProps(`${fieldsetItem.componentId}.root`, fieldsetRootPropNames);
const legendProps = getGeneratedProps(
  `${fieldsetItem.componentId}.legend`,
  fieldsetLegendPropNames,
);

export function FieldsetPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={fieldsetItem.title}
        description={fieldsetItem.description}
        source={fieldsetItem.source}
      />

      <Section
        title="Composition"
        description="Group related fields under one accessible legend."
      >
        <Example source={basicSource} align="stretch">
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Disabled"
        description="Disabling the fieldset disables every nested native form control."
      >
        <Example source={disabledSource} align="stretch">
          <DisabledExample />
        </Example>
      </Section>

      <Section title="Root props" description="Root groups related controls.">
        <PropsTable rows={rootProps} />
      </Section>

      <Section title="Legend props" description="Legend provides the group's accessible name.">
        <PropsTable rows={legendProps} />
      </Section>
    </Box>
  );
}
