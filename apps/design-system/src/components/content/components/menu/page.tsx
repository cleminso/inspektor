import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { menuItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import CheckboxExample from "./checkboxExample";
import checkboxSource from "./checkboxExample.tsx?raw";
import {
  menuCheckboxItemPropNames,
  menuGroupLabelPropNames,
  menuGroupPropNames,
  menuItemPropNames,
  menuPopupPropNames,
  menuPositionerPropNames,
  menuRootPropNames,
  menuShortcutPropNames,
  menuTriggerPropNames,
} from "./props";

const rootProps = getGeneratedProps("menu.root", menuRootPropNames);
const triggerProps = getGeneratedProps("menu.trigger", menuTriggerPropNames);
const positionerProps = getGeneratedProps("menu.positioner", menuPositionerPropNames);
const popupProps = getGeneratedProps("menu.popup", menuPopupPropNames);
const groupProps = getGeneratedProps("menu.group", menuGroupPropNames);
const groupLabelProps = getGeneratedProps("menu.groupLabel", menuGroupLabelPropNames);
const shortcutProps = getGeneratedProps("menu.shortcut", menuShortcutPropNames);
const itemProps = getGeneratedProps("menu.item", menuItemPropNames);
const checkboxItemProps = getGeneratedProps("menu.checkboxItem", menuCheckboxItemPropNames);

export function MenuPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader title={menuItem.title} description={menuItem.description} source={menuItem.source} />
      <Section
        title="Actions"
        description="Import Menu for an action menu. Base UI Menu owns focus, dismissal, positioning, and keyboard navigation."
      >
        <Example source={basicSource}><BasicExample /></Example>
      </Section>
      <Section title="Checkbox item" description="Use a checkbox item for a setting that can remain enabled or disabled.">
        <Example source={checkboxSource}><CheckboxExample /></Example>
      </Section>
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Trigger props"><PropsTable rows={triggerProps} /></Section>
      <Section title="Positioner props"><PropsTable rows={positionerProps} /></Section>
      <Section title="Popup props"><PropsTable rows={popupProps} /></Section>
      <Section title="Group props"><PropsTable rows={groupProps} /></Section>
      <Section title="Group label props"><PropsTable rows={groupLabelProps} /></Section>
      <Section title="Shortcut props"><PropsTable rows={shortcutProps} /></Section>
      <Section
        title="Item props"
        description="Use the danger variant for destructive or difficult-to-reverse actions."
      >
        <PropsTable rows={itemProps} />
      </Section>
      <Section title="Checkbox item props"><PropsTable rows={checkboxItemProps} /></Section>
    </DocsPage>
  );
}
