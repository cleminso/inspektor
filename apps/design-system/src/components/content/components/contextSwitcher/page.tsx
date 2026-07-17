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
  contextSwitcherRootPropNames,
  contextSwitcherSearchPropNames,
  contextSwitcherTriggerPropNames,
  contextSwitcherViewportPropNames,
} from "./props";
import SimpleExample from "./simpleExample";
import simpleSource from "./simpleExample.tsx?raw";
import StatusExample from "./statusExample";
import statusSource from "./statusExample.tsx?raw";

const rootProps = getGeneratedProps("contextSwitcher.root", contextSwitcherRootPropNames);
const triggerProps = getGeneratedProps("contextSwitcher.trigger", contextSwitcherTriggerPropNames);
const searchProps = getGeneratedProps("contextSwitcher.search", contextSwitcherSearchPropNames);
const contentProps = getGeneratedProps("contextSwitcher.content", contextSwitcherContentPropNames);
const viewportProps = getGeneratedProps(
  "contextSwitcher.viewport",
  contextSwitcherViewportPropNames,
);
const itemProps = getGeneratedProps("contextSwitcher.item", contextSwitcherItemPropNames);
const itemTextProps = getGeneratedProps(
  "contextSwitcher.itemText",
  contextSwitcherItemTextPropNames,
);

export function ContextSwitcherPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={contextSwitcherItem.title}
        description={contextSwitcherItem.description}
        source={contextSwitcherItem.source}
      />

      <Section
        title="Connection switcher"
        description="Use rich item descriptions and a footer action for saved application connections."
      >
        <Example source={connectionSource}>
          <ConnectionExample />
        </Example>
      </Section>

      <Section
        title="Simple context"
        description="Use a compact switcher for a branch-like context without supporting item details."
      >
        <Example source={simpleSource}>
          <SimpleExample />
        </Example>
      </Section>

      <Section
        title="Loading, empty, and error status"
        description="Compose status regions around long monospaced values while preserving the same switcher structure."
      >
        <Example source={statusSource}>
          <StatusExample />
        </Example>
      </Section>

      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Trigger props">
        <PropsTable rows={triggerProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section title="Search props">
        <PropsTable rows={searchProps} />
      </Section>
      <Section title="Viewport props">
        <PropsTable rows={viewportProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Item text props">
        <PropsTable rows={itemTextProps} />
      </Section>
    </DocsPage>
  );
}
