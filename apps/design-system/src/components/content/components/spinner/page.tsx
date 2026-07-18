import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { spinnerItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { spinnerPropNames } from "./props";

const spinnerProps = getGeneratedProps("spinner", spinnerPropNames);

export function SpinnerPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={spinnerItem.title}
        description={spinnerItem.description}
        source={spinnerItem.source}
      />
      <Section
        title="Loading status"
        description="Provide a label when the spinner is the only indication that work is in progress."
      >
        <Example source={basicSource}><BasicExample /></Example>
      </Section>
      <Section title="Spinner props"><PropsTable rows={spinnerProps} /></Section>
    </DocsPage>
  );
}
