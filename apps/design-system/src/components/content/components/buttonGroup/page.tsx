import { Box } from "@inspector/ds";
import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { buttonGroupItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import CompositionExample from "./compositionExample";
import compositionSource from "./compositionExample.tsx?raw";
import OrientationExample from "./orientationExample";
import orientationSource from "./orientationExample.tsx?raw";
import {
  buttonGroupRootPropNames,
  buttonGroupSeparatorPropNames,
} from "./props";

const rootProps = getGeneratedProps("buttonGroup.root", buttonGroupRootPropNames);
const separatorProps = getGeneratedProps("buttonGroup.separator", buttonGroupSeparatorPropNames);

export function ButtonGroupPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={buttonGroupItem.title}
        description={buttonGroupItem.description}
        source={buttonGroupItem.source}
      />

      <Section
        title="Related actions"
        description="Group controls that operate on the same object or workflow. Label the group for assistive technology."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section title="Orientation" description="Arrange grouped controls horizontally or vertically.">
        <Example source={orientationSource}>
          <OrientationExample />
        </Example>
      </Section>

      <Section
        title="Separator"
        description="Separators can clarify boundaries between adjacent actions."
      >
        <Example source={compositionSource}>
          <CompositionExample />
        </Example>
      </Section>

      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Separator props">
        <PropsTable rows={separatorProps} />
      </Section>
    </Box>
  );
}
