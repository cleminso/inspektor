import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { buttonItem } from "@/lib/registry";

import { ButtonPlayground } from "./playground";
import GlyphCompositionExample from "./glyphCompositionExample";
import glyphCompositionSource from "./glyphCompositionExample.tsx?raw";
import { buttonGlyphPropNames, buttonPropNames } from "./props";
import StackedExample from "./stackedExample";
import stackedSource from "./stackedExample.tsx?raw";
import VariantsExample from "./variantsExample";
import variantsSource from "./variantsExample.tsx?raw";

const buttonProps = getGeneratedProps(buttonItem.componentId, buttonPropNames);
const buttonGlyphProps = getGeneratedProps("button.glyph", buttonGlyphPropNames);

export function ButtonPage(): ReactElement {
  return (
    <ButtonPlayground>
      <Section title="All variants and states">
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>

      <Section
        title="Stacked action"
        description="Use the stacked layout for a full-width action with primary and secondary labels. The button owns its vertical padding and grows with its content."
      >
        <Example source={stackedSource}>
          <StackedExample />
        </Example>
      </Section>

      <Section
        title="Glyph composition"
        description={'Use Button.Glyph for ordinary icon-only, prefix, and suffix artwork. Button selects the standard glyph size; glyphSize="compact" records the explicit compact-control exception.'}
      >
        <Example source={glyphCompositionSource}>
          <GlyphCompositionExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Button combines constrained visual props with native button behavior and render composition."
      >
        <PropsTable rows={buttonProps} />
      </Section>

      <Section title="Glyph props">
        <PropsTable rows={buttonGlyphProps} />
      </Section>
    </ButtonPlayground>
  );
}
