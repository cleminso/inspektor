import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { formItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { formPropNames } from "./props";
import ServerErrorsExample from "./serverErrorsExample";
import serverErrorsSource from "./serverErrorsExample.tsx?raw";

const formProps = getGeneratedProps(formItem.componentId, formPropNames);

export function FormPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={formItem.title}
        description={formItem.description}
        source={formItem.source}
      />

      <Section
        title="Submission"
        description="Form validates registered fields and provides their values to onFormSubmit."
      >
        <Example source={basicSource} align="stretch">
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Server errors"
        description="External errors are matched to fields by their Field.Root name."
      >
        <Example source={serverErrorsSource} align="stretch">
          <ServerErrorsExample />
        </Example>
      </Section>

      <Section title="Props" description="Form also accepts native form attributes.">
        <PropsTable rows={formProps} />
      </Section>
    </DocsPage>
  );
}
