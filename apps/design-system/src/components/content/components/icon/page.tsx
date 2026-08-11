import { Box, Icon, Text } from "@inspector/ds";
import { Table } from "lucide-react";
import { type ReactElement } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { iconItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { iconPropNames } from "./props";

const iconProps = getGeneratedProps(iconItem.componentId, iconPropNames);

export function IconPage(): ReactElement {
  return (
    <ComponentDocsPage
      title={iconItem.title}
      description={iconItem.description}
      source={iconItem.source}
      preview={<Icon artwork={Table} />}
      sourceCode={basicSource}
    >
      <Section
        title="Sizes"
        description="Icon applies semantic dimensions to SVG artwork while inheriting its surrounding color."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Artwork contract"
        description="Pass a ref-forwarding SVG component through artwork. Icon does not accept plain function components, configured elements, render callbacks, non-SVG targets, presentation props, or meaningful-image labels."
      >
        <Box flexDirection="column" gap="s">
          <Text>
            The type requires a React 18-compatible forwarded SVG ref. Artwork must also forward every
            received SVG prop to one SVG root, preserve a stable viewBox, and use currentColor for visible
            paths or fills; those runtime requirements form the trusted artwork protocol.
          </Text>
          <Text>
            Artwork owns geometry and its documented stroke or fill category. Icon owns dimensions,
            inherited color, decorative accessibility, and layout normalization.
          </Text>
          <Text>
            Do not attach width, height, className, style, color, stroke, or accessibility overrides at
            the call site. No universal viewBox is required.
          </Text>
        </Box>
      </Section>
      <Section
        title="Stroke and fill categories"
        description="Use 2-unit strokes in 24-unit general outlines, 1.5-unit strokes in 16-unit compact disclosures, 2-unit strokes in 16-unit selection indicators, and approximately 1.25-unit strokes in 12-unit micro-navigation artwork. Spinners and filled artwork remain separate categories. Compare optical weight after viewBox scaling instead of forcing one raw stroke width across every glyph."
      />
      <Section title="Icon props">
        <PropsTable rows={iconProps} />
      </Section>
    </ComponentDocsPage>
  );
}
