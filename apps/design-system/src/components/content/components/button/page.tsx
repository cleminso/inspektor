import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { buttonItem } from "@/lib/registry";

import DisabledExample from "./disabledExample";
import disabledSource from "./disabledExample.tsx?raw";
import LoadingExample from "./loadingExample";
import loadingSource from "./loadingExample.tsx?raw";
import PrefixAndSuffixExample from "./prefixAndSuffix";
import prefixAndSuffixSource from "./prefixAndSuffix.tsx?raw";
import { buttonPropNames } from "./props";
import RoundedExample from "./roundedExample";
import roundedSource from "./roundedExample.tsx?raw";
import ShapeExample from "./shape";
import shapeSource from "./shape.tsx?raw";
import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";
import VariantsExample from "./variantsExample";
import variantsSource from "./variantsExample.tsx?raw";

const buttonProps = getGeneratedProps(buttonItem.componentId, buttonPropNames);

export function ButtonPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={buttonItem.title}
        description={buttonItem.description}
        source={buttonItem.source}
      />

      <Section
        title="All variants and states"
      >
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>

      <Section
        title="Sizes"
      >
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>

      <Section
        title="Shape"
        description="Square buttons contain one icon and require an `aria-label`."
      >
        <Example source={shapeSource}>
          <ShapeExample />
        </Example>
      </Section>

      <Section title="Rounded" description="A larger radius provides a softer button treatment.">
        <Example source={roundedSource}>
          <RoundedExample />
        </Example>
      </Section>

      <Section
        title="Loading"
        description="Loading keeps the label visible, remains focusable, and blocks repeated activation."
      >
        <Example source={loadingSource}>
          <LoadingExample />
        </Example>
      </Section>

      <Section
        title="Prefix and suffix"
        description="Place decorative icons before, after, or around the label."
      >
        <Example source={prefixAndSuffixSource}>
          <PrefixAndSuffixExample />
        </Example>
      </Section>

      <Section
        title="Disabled"
        description="Disabled and loading buttons share one neutral treatment across variants."
      >
        <Example source={disabledSource}>
          <DisabledExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Button combines constrained visual props with native button behavior and render composition."
      >
        <PropsTable rows={buttonProps} />
      </Section>
    </DocsPage>
  );
}
