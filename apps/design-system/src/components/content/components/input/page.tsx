import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { inputItem } from "@/lib/registry";

import { inputPropNames } from "./props";
import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";
import StatesExample from "./statesExample";
import statesSource from "./statesExample.tsx?raw";

const inputProps = getGeneratedProps(inputItem.componentId, inputPropNames);

export function InputPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={inputItem.title}
        description={inputItem.description}
        source={inputItem.source}
      />

      <Section title="Sizes" description="Choose a height that matches nearby controls.">
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>

      <Section
        title="States"
        description="Input uses a neutral focused border and a danger border with a subtle halo when invalid."
      >
        <Example source={statesSource} align="stretch">
          <StatesExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Provide an accessible name with a label, Field, or aria-label."
      >
        <PropsTable rows={inputProps} />
      </Section>
    </DocsPage>
  );
}
