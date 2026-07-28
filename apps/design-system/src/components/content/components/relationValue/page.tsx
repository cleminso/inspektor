import { type ReactElement } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { relationValueItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { relationDetailsPropNames, relationValuePropNames } from "./props";

const valueProps = getGeneratedProps("relationValue", relationValuePropNames);
const detailsProps = getGeneratedProps("relationDetails", relationDetailsPropNames);

export function RelationValuePage(): ReactElement {
  return (
    <ComponentDocsPage
      title={relationValueItem.title}
      description={relationValueItem.description}
      source={relationValueItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Navigation and display values"
        description="RelationValue renders a compact stored ID. RelationDetails pairs stored-ID navigation with a resolved display value and its copy action. Both accept router-independent href or rendered navigation."
      />
      <Section title="RelationValue props">
        <PropsTable rows={valueProps} />
      </Section>
      <Section title="RelationDetails props">
        <PropsTable rows={detailsProps} />
      </Section>
    </ComponentDocsPage>
  );
}
