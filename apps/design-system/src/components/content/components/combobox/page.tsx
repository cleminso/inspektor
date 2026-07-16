import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { comboboxItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import ControlledExample from "./controlledExample";
import controlledSource from "./controlledExample.tsx?raw";
import {
  comboboxClearPropNames,
  comboboxContentPropNames,
  comboboxIndicatorPropNames,
  comboboxInputTriggerPropNames,
  comboboxItemPropNames,
  comboboxItemTextPropNames,
  comboboxPopupFooterPropNames,
  comboboxPopupHeaderPropNames,
  comboboxPopupPropNames,
  comboboxPositionerPropNames,
  comboboxRootPropNames,
  comboboxTriggerPropNames,
  comboboxViewportPropNames,
} from "./props";

const rootProps = getGeneratedProps("combobox.root", comboboxRootPropNames);
const contentProps = getGeneratedProps("combobox.content", comboboxContentPropNames);
const clearProps = getGeneratedProps("combobox.clear", comboboxClearPropNames);
const triggerProps = getGeneratedProps("combobox.trigger", comboboxTriggerPropNames);
const inputTriggerProps = getGeneratedProps("combobox.inputTrigger", comboboxInputTriggerPropNames);
const positionerProps = getGeneratedProps("combobox.positioner", comboboxPositionerPropNames);
const popupProps = getGeneratedProps("combobox.popup", comboboxPopupPropNames);
const popupHeaderProps = getGeneratedProps("combobox.popupHeader", comboboxPopupHeaderPropNames);
const popupFooterProps = getGeneratedProps("combobox.popupFooter", comboboxPopupFooterPropNames);
const viewportProps = getGeneratedProps("combobox.viewport", comboboxViewportPropNames);
const itemProps = getGeneratedProps("combobox.item", comboboxItemPropNames);
const itemTextProps = getGeneratedProps("combobox.itemText", comboboxItemTextPropNames);
const indicatorProps = getGeneratedProps("combobox.itemIndicator", comboboxIndicatorPropNames);

export function ComboboxPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader title={comboboxItem.title} description={comboboxItem.description} source={comboboxItem.source} />
      <Section title="Filterable selection" description="Use Combobox when a predefined collection is large enough to require filtering.">
        <Example source={basicSource} align="stretch"><BasicExample /></Example>
      </Section>
      <Section title="Controlled value" description="Control the selected item while Base UI manages filtering and keyboard behavior.">
        <Example source={controlledSource} align="stretch"><ControlledExample /></Example>
      </Section>
      <Section title="Root props"><PropsTable rows={rootProps} /></Section>
      <Section title="Content props"><PropsTable rows={contentProps} /></Section>
      <Section title="Clear props"><PropsTable rows={clearProps} /></Section>
      <Section title="Trigger props"><PropsTable rows={triggerProps} /></Section>
      <Section title="Input trigger props"><PropsTable rows={inputTriggerProps} /></Section>
      <Section title="Positioner props"><PropsTable rows={positionerProps} /></Section>
      <Section title="Popup props"><PropsTable rows={popupProps} /></Section>
      <Section title="Popup header props"><PropsTable rows={popupHeaderProps} /></Section>
      <Section title="Popup footer props"><PropsTable rows={popupFooterProps} /></Section>
      <Section title="Viewport props"><PropsTable rows={viewportProps} /></Section>
      <Section title="Item props"><PropsTable rows={itemProps} /></Section>
      <Section title="Item text props"><PropsTable rows={itemTextProps} /></Section>
      <Section title="Item indicator props"><PropsTable rows={indicatorProps} /></Section>
    </DocsPage>
  );
}
