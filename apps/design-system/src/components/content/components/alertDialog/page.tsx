import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import DefaultExample from "./defaultExample";
import defaultSource from "./defaultExample.tsx?raw";
import {
  alertDialogClosePropNames,
  alertDialogContentPropNames,
  alertDialogRootPropNames,
} from "./props";

const rootProps = getGeneratedProps("alertDialog.root", alertDialogRootPropNames);
const contentProps = getGeneratedProps("alertDialog.content", alertDialogContentPropNames);
const closeProps = getGeneratedProps("alertDialog.close", alertDialogClosePropNames);

export function AlertDialogPage(): ReactElement {
  return (
    <>
      <Section
        title="Destructive confirmation"
        description="Use Alert Dialog when an action requires an explicit response before the application can proceed. Title and Description provide the dialog's accessible name and supporting context."
      >
        <Example source={defaultSource}>
          <DefaultExample />
        </Example>
      </Section>
      <Section
        title="Composition"
        description="Content owns the portal, backdrop, viewport, and popup. Actions groups the response controls. Close composes Base UI close behavior onto Button, which continues to own presentation."
      />
      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Content props">
        <PropsTable rows={contentProps} />
      </Section>
      <Section title="Close props">
        <PropsTable rows={closeProps} />
      </Section>
    </>
  );
}
