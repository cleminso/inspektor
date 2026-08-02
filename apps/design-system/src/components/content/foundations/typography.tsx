import { Box, Text, type TextColor, type TextVariant } from "@inspector/ds";
import { type ReactElement } from "react";

import { FoundationDocsPage } from "@/components/docs/foundationDocsPage";
import { Section } from "@/components/docs/section";
import { typographyFoundationItem } from "@/lib/registry";

const textVariants: Array<{ variant: TextVariant; sample: string }> = [
  { variant: "default", sample: "Default interface text" },
  { variant: "heading", sample: "Section heading" },
  { variant: "title", sample: "Interface title" },
  { variant: "body", sample: "Body text supports readable product descriptions and guidance." },
  { variant: "label", sample: "Control label" },
  { variant: "caption", sample: "Supporting caption" },
];

const textColors = [
  "default",
  "muted",
  "disabled",
  "danger",
  "error",
  "link",
  "inherit",
] as const satisfies readonly TextColor[];

export function TypographyFoundationPage(): ReactElement {
  return (
    <FoundationDocsPage item={typographyFoundationItem}>
      <Section
        title="Roles"
        description="Text variants pair visual hierarchy with appropriate semantic defaults."
      >
        <Box
          flexDirection="column"
          borderWidth={1}
          borderStyle="solid"
          borderColor="border"
          borderRadius="m"
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
              <Text as="code" variant="caption" color="muted">
                {variant}
              </Text>
              <Text as="div" variant={variant}>
                {sample}
              </Text>
            </Box>
          ))}
        </Box>
      </Section>

      <Section title="Colors" description="Text colors express hierarchy and semantic status.">
        <Box
          display="grid"
          gridTemplateColumns="auto-fit-s"
          gap="l"
          padding="xl"
          borderWidth={1}
          borderStyle="solid"
          borderColor="border"
          borderRadius="m"
        >
          {textColors.map((color) => (
            <Text key={color} color={color}>
              {color}
            </Text>
          ))}
        </Box>
      </Section>

      <Section title="Utilities" description="Formatting helpers cover data-heavy interfaces.">
        <Box flexDirection="column" gap="m">
          <Text monospace>monospace: connection_42</Text>
          <Text tabularNums>tabularNums: 1,234,567</Text>
          <Text formatter="compact">{1284000}</Text>
          <Text lineThrough>Previous value</Text>
          <Text loading placeholderText="Loading account name">
            Account name
          </Text>
          <Text loading placeholderNumberOfLines={3}>
            Loading description
          </Text>
        </Box>
      </Section>
    </FoundationDocsPage>
  );
}
