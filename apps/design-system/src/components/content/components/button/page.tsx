import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { buttonItem } from "@/lib/registry";

import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";
import StateExample from "./stateExample";
import statesSource from "./stateExample.tsx?raw";
import VariantsExample from "./variantsExample";
import variantsSource from "./variantsExample.tsx?raw";
import { buttonPropNames } from "./props";

const buttonProps = getGeneratedProps(buttonItem.componentId, buttonPropNames);

export function ButtonPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={buttonItem.title}
        description={buttonItem.description}
        source={buttonItem.source}
      />

      <Section title="Variants" description="Treatments communicate action hierarchy and intent.">
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>

      <Section
        title="Sizes"
        description="Text and square icon sizes share a consistent height scale."
      >
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>

      <Section
        title="States"
        description="Loading preserves layout, disabled blocks interaction, and full width fills its container."
      >
        <Example source={statesSource} align="stretch">
          <StateExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Button also accepts native button attributes and Base UI render composition props."
      >
        <PropsTable rows={buttonProps} />
      </Section>
    </DocsPage>
  );
}
