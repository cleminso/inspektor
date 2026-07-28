import { type ReactElement } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { structuredValuePreviewItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { structuredValuePreviewPropNames } from "./props";

const structuredValuePreviewProps = getGeneratedProps(
  structuredValuePreviewItem.componentId,
  structuredValuePreviewPropNames,
);

export function StructuredValuePreviewPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={structuredValuePreviewItem.title}
      description={structuredValuePreviewItem.description}
      source={structuredValuePreviewItem.source}
      preview={<BasicExample />}
      sourceCode={basicSource}
    >
      <Section
        title="Bounded summaries"
        description="Consumers provide bounded normalized labels and explicit continuation state. The component renders array, object, or scalar models without reading arbitrary source objects."
      />
      <Section title="StructuredValuePreview props">
        <PropsTable rows={structuredValuePreviewProps} />
      </Section>
    </ComponentDocsPage>
  );
}
