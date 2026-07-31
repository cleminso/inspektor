import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { buttonItem } from "@/lib/registry";

import { ButtonPlayground } from "./playground";
import { buttonPropNames } from "./props";
import VariantsExample from "./variantsExample";
import variantsSource from "./variantsExample.tsx?raw";

const buttonProps = getGeneratedProps(buttonItem.componentId, buttonPropNames);

export function ButtonPage(): ReactElement {
  return (
    <ButtonPlayground>
      <Section title="All variants and states">
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Button combines constrained visual props with native button behavior and render composition."
      >
        <PropsTable rows={buttonProps} />
      </Section>
    </ButtonPlayground>
  );
}
