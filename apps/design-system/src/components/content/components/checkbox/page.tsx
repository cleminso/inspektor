import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { checkboxItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { checkboxPropNames } from "./props";
import StatesExample from "./statesExample";
import statesSource from "./statesExample.tsx?raw";

const checkboxProps = getGeneratedProps(checkboxItem.componentId, checkboxPropNames);

export function CheckboxPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={checkboxItem.title}
        description={checkboxItem.description}
        source={checkboxItem.source}
      />

      <Section title="Field" description="Use Field.Label to provide an accessible name.">
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section title="States" description="Checkbox supports checked, mixed, checked-disabled, focus-visible, and size states.">
        <Example source={statesSource}>
          <StatesExample />
        </Example>
      </Section>

      <Section title="Props" description="Checkbox participates in Field and native forms automatically.">
        <PropsTable rows={checkboxProps} />
      </Section>
    </DocsPage>
  );
}
