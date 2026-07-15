import { Box } from "@inspector/ds";
import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { toastItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import PreserveExample from "./preserveExample";
import preserveSource from "./preserveExample.tsx?raw";
import { toasterPropNames } from "./props";

const toasterProps = getGeneratedProps(toastItem.componentId, toasterPropNames);

export function ToastPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={toastItem.title}
        description={toastItem.description}
        source={toastItem.source}
      />
      <Section title="Semantic messages" description="Mount one Toaster and create concise notifications through toasts.">
        <Example source={basicSource}><BasicExample /></Example>
      </Section>
      <Section title="Preserve" description="Preserve messages that must remain until the user dismisses them.">
        <Example source={preserveSource}><PreserveExample /></Example>
      </Section>
      <Section title="Toaster props"><PropsTable rows={toasterProps} /></Section>
    </Box>
  );
}
