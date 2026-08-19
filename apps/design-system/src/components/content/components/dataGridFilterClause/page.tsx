import { type ReactElement } from "react";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import CreateExample from "./createExample";
import createSource from "./createExample.tsx?raw";
import EditExample from "./editExample";
import editSource from "./editExample.tsx?raw";
import InvalidExample from "./invalidExample";
import invalidSource from "./invalidExample.tsx?raw";
import LongValueExample from "./longValueExample";
import longValueSource from "./longValueExample.tsx?raw";
import OverflowExample from "./overflowExample";
import overflowSource from "./overflowExample.tsx?raw";
import { removePropNames, rootPropNames, triggerPropNames } from "./props";

export function DataGridFilterClausePage(): ReactElement {
  return <>
    <Section title="Compound clause"><Example source={createSource}><CreateExample /></Example></Section>
    <Section title="Edit"><Example source={editSource}><EditExample /></Example></Section>
    <Section title="Invalid clause"><Example source={invalidSource}><InvalidExample /></Example></Section>
    <Section title="Long value"><Example source={longValueSource}><LongValueExample /></Example></Section>
    <Section title="Horizontal overflow"><Example source={overflowSource}><OverflowExample /></Example></Section>
    <Section title="Root props"><PropsTable rows={getGeneratedProps("dataGridFilterClause.root", rootPropNames)} /></Section>
    <Section title="Trigger props"><PropsTable rows={getGeneratedProps("dataGridFilterClause.trigger", triggerPropNames)} /></Section>
    <Section title="Remove props"><PropsTable rows={getGeneratedProps("dataGridFilterClause.remove", removePropNames)} /></Section>
  </>;
}
