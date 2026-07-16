import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { contextSwitcherItem } from "@/lib/registry";

import ConnectionExample from "./connectionExample";
import connectionSource from "./connectionExample.tsx?raw";
import {
  contextSwitcherContentPropNames,
  contextSwitcherItemPropNames,
  contextSwitcherItemTextPropNames,
  contextSwitcherPopupPropNames,
  contextSwitcherRootPropNames,
  contextSwitcherSearchPropNames,
  contextSwitcherTriggerPropNames,
} from "./props";
import StatusExample from "./statusExample";
import statusSource from "./statusExample.tsx?raw";

const rootProps = getGeneratedProps("contextSwitcher.root", contextSwitcherRootPropNames);
const triggerProps = getGeneratedProps("contextSwitcher.trigger", contextSwitcherTriggerPropNames);
const popupProps = getGeneratedProps("contextSwitcher.popup", contextSwitcherPopupPropNames);
const searchProps = getGeneratedProps("contextSwitcher.search", contextSwitcherSearchPropNames);
const contentProps = getGeneratedProps("contextSwitcher.content", contextSwitcherContentPropNames);
const itemProps = getGeneratedProps("contextSwitcher.item", contextSwitcherItemPropNames);
const itemTextProps = getGeneratedProps("contextSwitcher.itemText", contextSwitcherItemTextPropNames);

export function ContextSwitcherPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={contextSwitcherItem.title}
        description={contextSwitcherItem.description}
        source={contextSwitcherItem.source}
      />

      <Section
        title="Application context"
        description="Use Context Switcher when selection changes the active resource or scope rather than a form value."
      >
        <Example source={connectionSource}>
          <ConnectionExample />
        </Example>
      </Section>

      <Section
        title="Long values"
        description="Use content-sized popups for values that need more space than the constrained trigger."
      >
        <Example source={statusSource}>
          <StatusExample />
        </Example>
      </Section>

      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Trigger props"><PropsTable rows={triggerProps} /></Section>
      <Section title="Popup props"><PropsTable rows={popupProps} /></Section>
      <Section title="Search props"><PropsTable rows={searchProps} /></Section>
      <Section title="Content props"><PropsTable rows={contentProps} /></Section>
      <Section title="Item props"><PropsTable rows={itemProps} /></Section>
      <Section title="Item text props"><PropsTable rows={itemTextProps} /></Section>
    </DocsPage>
  );
}
