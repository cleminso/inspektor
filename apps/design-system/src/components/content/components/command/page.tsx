import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import InputOverflowExample from "./inputOverflowExample";
import inputOverflowSource from "./inputOverflowExample.tsx?raw";
import { commandDialogPropNames, commandInputPropNames, commandItemPropNames, commandItemTextPropNames, commandRootPropNames } from "./props";
import StandaloneExample from "./standaloneExample";
import standaloneSource from "./standaloneExample.tsx?raw";

export function CommandPage(): ReactElement {
  return (
    <>
      <Section title="Modal command" description="Compose Dialog containment with searchable Combobox options.">
        <Example source={basicSource}><BasicExample /></Example>
      </Section>
      <Section title="Standalone command" description="Use the same command vocabulary inside an existing surface.">
        <Example source={standaloneSource}><StandaloneExample /></Example>
      </Section>
      <Section
        title="Input row overflow"
        description="Keep completed command chips on one horizontally scrollable row without expanding the command surface."
      >
        <Example source={inputOverflowSource}><InputOverflowExample /></Example>
      </Section>
      <Section title="Root props"><PropsTable rows={getGeneratedProps("command.root", commandRootPropNames)} /></Section>
      <Section title="Dialog props"><PropsTable rows={getGeneratedProps("command.dialog", commandDialogPropNames)} /></Section>
      <Section title="Input props"><PropsTable rows={getGeneratedProps("command.input", commandInputPropNames)} /></Section>
      <Section title="Item props"><PropsTable rows={getGeneratedProps("command.item", commandItemPropNames)} /></Section>
      <Section title="Item text props"><PropsTable rows={getGeneratedProps("command.itemText", commandItemTextPropNames)} /></Section>
    </>
  );
}
