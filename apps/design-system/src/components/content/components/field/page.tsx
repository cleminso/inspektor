import { Box } from "@inspector/ds";
import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { fieldItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import {
  fieldDescriptionPropNames,
  fieldErrorPropNames,
  fieldLabelPropNames,
  fieldRootPropNames,
} from "./props";
import ValidationExample from "./validationExample";
import validationSource from "./validationExample.tsx?raw";

const rootProps = getGeneratedProps(`${fieldItem.componentId}.root`, fieldRootPropNames);
const labelProps = getGeneratedProps(`${fieldItem.componentId}.label`, fieldLabelPropNames);
const descriptionProps = getGeneratedProps(
  `${fieldItem.componentId}.description`,
  fieldDescriptionPropNames,
);
const errorProps = getGeneratedProps(`${fieldItem.componentId}.error`, fieldErrorPropNames);

export function FieldPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={fieldItem.title}
        description={fieldItem.description}
        source={fieldItem.source}
      />

      <Section
        title="Composition"
        description="Field associates its label and description with a nested Base UI control."
      >
        <Example source={basicSource} align="stretch">
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Validation"
        description="Control invalid state externally or use Base UI validation through Field.Root."
      >
        <Example source={validationSource} align="stretch">
          <ValidationExample />
        </Example>
      </Section>

      <Section title="Root props" description="Root owns field state and validation.">
        <PropsTable rows={rootProps} />
      </Section>

      <Section title="Label props" description="Label provides the control's accessible name.">
        <PropsTable rows={labelProps} />
      </Section>

      <Section
        title="Description props"
        description="Description provides accessible supporting information."
      >
        <PropsTable rows={descriptionProps} />
      </Section>

      <Section title="Error props" description="Error displays matching validation messages.">
        <PropsTable rows={errorProps} />
      </Section>
    </Box>
  );
}
