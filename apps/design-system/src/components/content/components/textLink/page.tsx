import { TextLink } from "@inspector/ds";
import { type ReactElement } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { getGeneratedProps } from "@/lib/propsData";
import { textLinkItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { textLinkPropNames } from "./props";
import RouterExample from "./routerExample";
import routerSource from "./routerExample.tsx?raw";

const textLinkProps = getGeneratedProps(textLinkItem.componentId, textLinkPropNames);

export function TextLinkPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={textLinkItem.title}
      description={textLinkItem.description}
      source={textLinkItem.source}
      preview={<TextLink href="#text-link-examples">Read documentation</TextLink>}
      sourceCode={createPlaygroundSource({
        imports: { TextLink: true },
        example: '<TextLink href="/docs">Read documentation</TextLink>',
      })}
    >
      <Section
        title="Text links"
        description="Use TextLink for inline navigation while preserving native anchor semantics."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Router composition"
        description="Compose TextLink onto the application router without adding button semantics."
      >
        <Example source={routerSource}>
          <RouterExample />
        </Example>
      </Section>
      <Section title="TextLink props">
        <PropsTable rows={textLinkProps} />
      </Section>
    </ComponentDocsPage>
  );
}
