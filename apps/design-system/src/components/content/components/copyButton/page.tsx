import { Box } from "@inspector/ds";
import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { copyButtonItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { copyButtonPropNames } from "./props";
import VariantsExample from "./variantsExample";
import variantsSource from "./variantsExample.tsx?raw";

const props = getGeneratedProps("copyButton", copyButtonPropNames);

export function CopyButtonPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={copyButtonItem.title}
        description={copyButtonItem.description}
        source={copyButtonItem.source}
      />

      <Section
        title="Copy action"
        description="Provide a contextual accessible label. The component owns clipboard feedback, icons, and failure handling."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Variants and sizes"
        description="Use compact ghost actions beside values and stronger treatments when the copy action stands alone."
      >
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={props} />
      </Section>
    </Box>
  );
}
