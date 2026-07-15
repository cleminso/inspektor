import { Box, CopyButton, Text } from "@inspector/ds";
import {
  backgroundColors,
  borderColors,
  paletteValues,
  textColors,
  type PaletteToken,
} from "@inspector/ds/theme";
import * as stylex from "@stylexjs/stylex";
import { type ReactElement } from "react";

import { PageHeader } from "@/components/docs/pageHeader";
import { Section } from "@/components/docs/section";
import { colorsFoundationItem } from "@/lib/registry";

const backgroundTokens = [
  "bg-surface-1",
  "bg-primary",
  "bg-secondary",
  "bg-surface-hover",
  "bg-surface-selected",
  "bg-surface-highlight",
  "bg-inverse",
] as const;

const textTokens = [
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-disabled",
  "text-accent",
  "text-danger",
  "text-success",
  "text-warning",
  "text-info",
  "text-constant",
  "text-type",
] as const;

const borderTokens = [
  "border",
  "border-secondary",
  "border-focused",
  "border-warning",
  "border-danger",
  "border-success",
] as const;

const paletteEntries = Object.entries(paletteValues) as Array<[PaletteToken, string]>;

function PaletteColorCard({ name, value }: { name: PaletteToken; value: string }): ReactElement {
  return (
    <article {...stylex.props(styles.paletteCard)}>
      <span aria-hidden="true" {...stylex.props(styles.swatch)} style={{ background: value }} />
      <span {...stylex.props(styles.paletteDetails)}>
        <span {...stylex.props(styles.paletteText)}>
          <span {...stylex.props(styles.paletteName)}>{name}</span>
          <span {...stylex.props(styles.paletteValue)}>{value}</span>
        </span>
        <CopyButton textToCopy={value} label={`Copy ${name} value`} />
      </span>
    </article>
  );
}

function ColorToken({ name, value }: { name: string; value: string }): ReactElement {
  return (
    <Box
      flexDirection="column"
      overflow="hidden"
      borderWidth={1}
      borderStyle="solid"
      borderColor="border"
      borderRadius="l"
      backgroundColor="bg-surface-1"
    >
      <div aria-hidden="true" style={{ background: value }} {...stylex.props(styles.swatch)} />
      <Text as="code" variant="caption" style={{ margin: 0, padding: 12 }}>
        {name}
      </Text>
    </Box>
  );
}

export function ColorFoundationPage(): ReactElement {
  return (
    <Box flexDirection="column" gap="4xl" maxWidth={840} marginHorizontal="auto" padding="xl">
      <PageHeader
        title={colorsFoundationItem.title}
        description={colorsFoundationItem.description}
        source={colorsFoundationItem.source}
      />

      <Section
        title="Palette"
        description="Primitive colors from value.stylex.ts. Select a card to copy its OKLCH value."
      >
        <div {...stylex.props(styles.grid)}>
          {paletteEntries.map(([name, value]) => (
            <PaletteColorCard key={name} name={name} value={value} />
          ))}
        </div>
      </Section>

      <Section
        title="Background"
        description="Surface tokens establish elevation and interaction states."
      >
        <div {...stylex.props(styles.grid)}>
          {backgroundTokens.map((token) => (
            <ColorToken key={token} name={token} value={String(backgroundColors[token])} />
          ))}
        </div>
      </Section>

      <Section
        title="Text"
        description="Foreground tokens communicate hierarchy, status, and code semantics."
      >
        <div {...stylex.props(styles.grid)}>
          {textTokens.map((token) => (
            <ColorToken key={token} name={token} value={String(textColors[token])} />
          ))}
        </div>
      </Section>

      <Section title="Border" description="Border tokens separate surfaces and expose status.">
        <div {...stylex.props(styles.grid)}>
          {borderTokens.map((token) => (
            <ColorToken key={token} name={token} value={String(borderColors[token])} />
          ))}
        </div>
      </Section>
    </Box>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  swatch: {
    display: "block",
    height: 88,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "light-dark(oklch(0.852 0.006 43.325), oklch(0.391 0.0077 317.73))",
  },
  paletteCard: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: {
      default: "light-dark(oklch(0.852 0.006 43.325), oklch(0.391 0.0077 317.73))",
      ":hover": "light-dark(oklch(0.708 0.007 5.708), oklch(0.548 0.004 325.63))",
      ":focus-within": "light-dark(oklch(0.708 0.007 5.708), oklch(0.548 0.004 325.63))",
    },
    borderRadius: 2,
    backgroundColor: "light-dark(oklch(0.988 0.004 34.309), oklch(0.211 0.0042 308.24))",
    color: "inherit",
  },
  paletteDetails: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
  },
  paletteText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  paletteName: {
    fontFamily: "'GeistMono', ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 12,
    fontWeight: 500,
  },
  paletteValue: {
    overflow: "hidden",
    fontFamily: "'GeistMono', ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 11,
    color: "light-dark(oklch(0.645 0.007 350.912), oklch(0.661 0.002 325.597))",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});
