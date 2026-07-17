import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { selectItem } from "@/lib/registry";

import DefaultOptionsExample from "./defaultOptionsExample";
import defaultOptionsSource from "./defaultOptionsExample.tsx?raw";
import DisabledExample from "./disabledExample";
import disabledSource from "./disabledExample.tsx?raw";
import LabelExample from "./labelExample";
import labelSource from "./labelExample.tsx?raw";
import PrefixAndSuffixExample from "./prefixAndSuffixExample";
import prefixAndSuffixSource from "./prefixAndSuffixExample.tsx?raw";
import { selectItemPropNames, selectRootPropNames, selectTriggerPropNames } from "./props";
import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";

const rootProps = getGeneratedProps("select.root", selectRootPropNames);
const triggerProps = getGeneratedProps("select.trigger", selectTriggerPropNames);
const itemProps = getGeneratedProps("select.item", selectItemPropNames);

export function SelectPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={selectItem.title}
        description={selectItem.description}
        source={selectItem.source}
      />
      <Section
        title="Default options"
        description="Use Select for compact collections that do not require filtering."
      >
        <Example source={defaultOptionsSource}>
          <DefaultOptionsExample />
        </Example>
      </Section>
      <Section title="Sizes" description="Match the trigger size to adjacent controls.">
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>
      <Section
        title="Prefix and suffix"
        description="Add concise context without changing the selected value."
      >
        <Example source={prefixAndSuffixSource}>
          <PrefixAndSuffixExample />
        </Example>
      </Section>
      <Section
        title="Disabled"
        description="Disable the full control or individual unavailable options."
      >
        <Example source={disabledSource}>
          <DisabledExample />
        </Example>
      </Section>
      <Section title="Label" description="Use Select.Label to provide an accessible visible name.">
        <Example source={labelSource} align="stretch">
          <LabelExample />
        </Example>
      </Section>
      <Section
        title="Root props"
        description="Invalid state remains in the API metadata rather than a dedicated visual example."
      >
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
    </DocsPage>
  );
}
