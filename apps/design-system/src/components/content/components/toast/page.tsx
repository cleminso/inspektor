import { type ReactElement } from "react";

import { DocsPage } from "@/components/docs/docsPage";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/pageHeader";
import { Section } from "@/components/docs/section";
import { toastItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import PreserveExample from "./preserveExample";
import preserveSource from "./preserveExample.tsx?raw";
import PromiseExample from "./promiseExample";
import promiseSource from "./promiseExample.tsx?raw";

export function ToastPage(): ReactElement {
  return (
    <DocsPage>
      <PageHeader
        title={toastItem.title}
        description={toastItem.description}
        source={toastItem.source}
      />
      <Section title="Semantic messages" description="Mount one Toaster and create neutral, success, warning, or error notifications through toasts.">
        <Example source={basicSource}><BasicExample /></Example>
      </Section>
      <Section title="Preserve" description="Preserve messages that must remain until the user dismisses them.">
        <Example source={preserveSource}><PreserveExample /></Example>
      </Section>
      <Section title="Promise lifecycle" description="Use the promise helper to update one notification as asynchronous work completes.">
        <Example source={promiseSource}><PromiseExample /></Example>
      </Section>
    </DocsPage>
  );
}
