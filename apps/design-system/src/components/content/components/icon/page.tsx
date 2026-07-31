import { Icon } from "@inspector/ds";
import { Table } from "lucide-react";
import { type ReactElement } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { iconItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { iconPropNames } from "./props";

const iconProps = getGeneratedProps(iconItem.componentId, iconPropNames);

export function IconPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={iconItem.title}
      description={iconItem.description}
      source={iconItem.source}
      preview={<Icon render={<Table />} />}
      sourceCode={basicSource}
    >
      <Section
        title="Sizes"
        description="Icon applies semantic dimensions to SVG artwork while inheriting its surrounding color."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section title="Icon props">
        <PropsTable rows={iconProps} />
      </Section>
    </ComponentDocsPage>
  );
}
