import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { toggleGroupItem } from "@/lib/registry";

import { toggleGroupItemPropNames, toggleGroupRootPropNames } from "./props";
import ViewSwitcherExample from "./viewSwitcherExample";
import viewSwitcherSource from "./viewSwitcherExample.tsx?raw";

const rootProps = getGeneratedProps("toggleGroup.root", toggleGroupRootPropNames);
const itemProps = getGeneratedProps("toggleGroup.item", toggleGroupItemPropNames);

export function ToggleGroupPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={toggleGroupItem.title}
        description={toggleGroupItem.description}
        source={toggleGroupItem.source}
      />

      <Section
        title="View switcher"
        description="Use a controlled single-selection group when one view must remain selected."
      >
        <Example source={viewSwitcherSource}>
          <ViewSwitcherExample />
        </Example>
      </Section>

      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
    </DocsPage>
  );
}
