import { Box, Text, type TextVariant } from "@inspector/ds";
import * as stylex from "@stylexjs/stylex";
import { type ReactElement } from "react";

import { PageHeader } from "@/components/docs/pageHeader";
import { Section } from "@/components/docs/section";
import { typographyFoundationItem } from "@/lib/registry";

const textVariants: Array<{ variant: TextVariant; sample: string }> = [
  { variant: "default", sample: "Default interface text" },
  { variant: "heading-l", sample: "Large heading" },
  { variant: "heading-m", sample: "Medium heading" },
  { variant: "heading-s", sample: "Small heading" },
  { variant: "heading-xs", sample: "Extra-small heading" },
  { variant: "title", sample: "Interface title" },
  { variant: "body", sample: "Body text supports readable product descriptions and guidance." },
  { variant: "label", sample: "Control label" },
  { variant: "caption", sample: "Supporting caption" },
];

const textColors = [
  "default",
  "muted",
  "subtle",
  "disabled",
  "accent",
  "danger",
  "error",
  "success",
  "warning",
  "info",
  "type",
  "constant",
  "inverse",
  "inherit",
] as const;

export function TypographyFoundationPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={typographyFoundationItem.title}
        description={typographyFoundationItem.description}
        source={typographyFoundationItem.source}
      />

      <Section
        title="Roles"
        description="Text variants pair visual hierarchy with appropriate semantic defaults."
      >
        <Box
          flexDirection="column"
          borderWidth={1}
          borderStyle="solid"
          borderColor="border"
          borderRadius="l"
          overflow="hidden"
        >
          {textVariants.map(({ variant, sample }) => (
            <Box
              key={variant}
              flexDirection="column"
              gap="m"
              padding="xl"
              borderBottomWidth={1}
              borderStyle="solid"
              borderColor="border"
            >
              <Text as="code" variant="caption" color="muted" style={{ margin: 0 }}>
                {variant}
              </Text>
              <Text as="div" variant={variant} style={{ margin: 0 }}>
                {sample}
              </Text>
            </Box>
          ))}
        </Box>
      </Section>

      <Section title="Colors" description="Text colors express hierarchy and semantic status.">
        <div {...stylex.props(styles.colorList)}>
          {textColors.map((color) => (
            <Text key={color} color={color} style={{ margin: 0 }}>
              {color}
            </Text>
          ))}
        </div>
      </Section>

      <Section title="Utilities" description="Formatting helpers cover data-heavy interfaces.">
        <Box flexDirection="column" gap="m">
          <Text monospace style={{ margin: 0 }}>
            monospace: connection_42
          </Text>
          <Text tabularNums style={{ margin: 0 }}>
            tabularNums: 1,234,567
          </Text>
          <Text formatter="compact" style={{ margin: 0 }}>
            {1284000}
          </Text>
        </Box>
      </Section>
    </Box>
  );
}

const styles = stylex.create({
  colorList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "light-dark(oklch(0.852 0.006 43.325), oklch(0.391 0.0077 317.73))",
    borderRadius: 6,
  },
});
