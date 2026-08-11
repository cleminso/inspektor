import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import DefaultExample from "./defaultExample";
import defaultSource from "./defaultExample.tsx?raw";
import DisabledItemsExample from "./disabledItemsExample";
import disabledItemsSource from "./disabledItemsExample.tsx?raw";
import PrefixSuffixExample from "./prefixSuffixExample";
import prefixSuffixSource from "./prefixSuffixExample.tsx?raw";
import { ContextMenuPlayground } from "./playground";
import {
  contextMenuCheckboxItemPropNames,
  contextMenuContentPropNames,
  contextMenuItemPropNames,
  contextMenuLinkItemPropNames,
  contextMenuPositionerPropNames,
  contextMenuRadioItemPropNames,
  contextMenuRootPropNames,
} from "./props";

const rootProps = getGeneratedProps("contextMenu.root", contextMenuRootPropNames);
const contentProps = getGeneratedProps("contextMenu.content", contextMenuContentPropNames);
const positionerProps = getGeneratedProps(
  "contextMenu.positioner",
  contextMenuPositionerPropNames,
);
const itemProps = getGeneratedProps("contextMenu.item", contextMenuItemPropNames);
const linkItemProps = getGeneratedProps("contextMenu.linkItem", contextMenuLinkItemPropNames);
const checkboxItemProps = getGeneratedProps(
  "contextMenu.checkboxItem",
  contextMenuCheckboxItemPropNames,
);
const radioItemProps = getGeneratedProps("contextMenu.radioItem", contextMenuRadioItemPropNames);

export function ContextMenuPage(): ReactElement {
  return (
    <ContextMenuPlayground>
      <Section
        title="Default"
        description="Right-click the trigger to open contextual actions. Context menus supplement a visible Menu exposing the same actions; they are never the only action path."
      >
        <Example source={defaultSource}>
          <DefaultExample />
        </Example>
      </Section>
      <Section
        title="Disabled items"
        description="Derive availability from the current tab collection and disable actions that cannot run."
      >
        <Example source={disabledItemsSource}>
          <DisabledItemsExample />
        </Example>
      </Section>
      <Section
        title="Prefix and suffix"
        description="Use prefixes for recognition and suffixes for keyboard hints or metadata."
      >
        <Example source={prefixSuffixSource}>
          <PrefixSuffixExample />
        </Example>
      </Section>
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section
        title="Positioner props"
        description="Use Positioner when composing the popup layers directly instead of using Content."
      >
        <PropsTable rows={positionerProps} />
      </Section>
      <Section
        title="Item props"
        description="Use the danger variant for destructive or difficult-to-reverse actions."
      >
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Link item props">
        <PropsTable rows={linkItemProps} />
      </Section>
      <Section title="Checkbox item props">
        <PropsTable rows={checkboxItemProps} />
      </Section>
      <Section title="Radio item props">
        <PropsTable rows={radioItemProps} />
      </Section>
    </ContextMenuPlayground>
  );
}
