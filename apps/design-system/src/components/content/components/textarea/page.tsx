import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { textareaItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { textareaPropNames } from "./props";

const textareaProps = getGeneratedProps(textareaItem.componentId, textareaPropNames);

export function TextareaPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={textareaItem.title}
        description={textareaItem.description}
        source={textareaItem.source}
      />

      <Section
        title="Multiline value"
        description="Textarea participates in Field labeling and validation."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={textareaProps} />
      </Section>
    </DocsPage>
  );
}
