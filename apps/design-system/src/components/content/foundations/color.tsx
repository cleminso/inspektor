import { Text, Toaster, toasts } from "@inspector/ds";
import { paletteValues, type PaletteToken } from "@inspector/ds/theme";
import * as stylex from "@stylexjs/stylex";
import { type ReactElement } from "react";
import { useTheme } from "next-themes";

import { DocsPage } from "@/components/docs/docsPage";
import { PageHeader } from "@/components/docs/pageHeader";
import { Section } from "@/components/docs/section";
import { colorsFoundationItem } from "@/lib/registry";

const scaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

type ScaleStep = (typeof scaleSteps)[number];
type ThemeMode = "light" | "dark";
type ScaleName = "gray" | "grayAlpha" | "neutral" | "neutralAlpha" | "blue" | "red" | "orange" | "yellow" | "green";

interface ColorSwatch {
  label: string;
  token: PaletteToken;
  value: string;
}

interface ColorScale {
  label: string;
  swatches: ColorSwatch[];
}

function getScaleToken(scaleName: ScaleName, step: ScaleStep): PaletteToken {
  return `${scaleName}${step}` as PaletteToken;
}

function getSwatch(scaleName: ScaleName, step: ScaleStep): ColorSwatch {
  const token = getScaleToken(scaleName, step);

  return {
    label: String(step),
    token,
    value: paletteValues[token],
  };
}

function getScale(label: string, scaleName: ScaleName): ColorScale {
  return {
    label,
    swatches: scaleSteps.map((step) => getSwatch(scaleName, step)),
  };
}

function getBackgroundScale(mode: ThemeMode): ColorScale {
  const backgroundSwatches =
    mode === "dark"
      ? [getSwatch("neutral", 50), getSwatch("neutral", 100)]
      : [getSwatch("gray", 50), getSwatch("gray", 100)];

  return {
    label: "Backgrounds",
    swatches: backgroundSwatches.map((swatch, index) => ({
      ...swatch,
      label: `Background ${index + 1}`,
    })),
  };
}

function getModeScales(mode: ThemeMode): ColorScale[] {
  const neutralScales =
    mode === "dark"
      ? [getScale("Neutral", "neutral"), getScale("Neutral alpha", "neutralAlpha")]
      : [getScale("Gray", "gray"), getScale("Gray alpha", "grayAlpha")];

  return [
    getBackgroundScale(mode),
    ...neutralScales,
    getScale("Blue", "blue"),
    getScale("Red", "red"),
    getScale("Orange", "orange"),
    getScale("Yellow", "yellow"),
    getScale("Green", "green"),
  ];
}

async function copyColorValue(swatch: ColorSwatch): Promise<void> {
  try {
    await navigator.clipboard.writeText(swatch.value);
    toasts.success("Color copied", {
      description: `${swatch.token}: ${swatch.value}`,
    });
  } catch {
    toasts.error("Could not copy color", {
      description: swatch.value,
    });
  }
}

function ColorSwatchButton({ swatch }: { swatch: ColorSwatch }): ReactElement {
  return (
    <li {...stylex.props(styles.swatchItem)}>
      <button
        type="button"
        aria-label={`Copy ${swatch.token} value`}
        onClick={() => {
          void copyColorValue(swatch);
        }}
        {...stylex.props(styles.swatchButton)}
        style={{ backgroundColor: swatch.value }}
      />
    </li>
  );
}

function ScaleStepHeader(): ReactElement {
  return (
    <div aria-hidden="true" {...stylex.props(styles.stepHeader)}>
      <span {...stylex.props(styles.labelColumn)} />
      <div {...stylex.props(styles.swatchList)}>
        {scaleSteps.map((step) => (
          <span key={step} {...stylex.props(styles.stepHeaderItem)}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

function ColorScaleRow({ scale }: { scale: ColorScale }): ReactElement {
  const labelId = `color-scale-${scale.label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div {...stylex.props(styles.scaleRow)}>
      <div {...stylex.props(styles.labelColumn)}>
        <Text id={labelId} as="h3" variant="title" {...stylex.props(styles.scaleLabel)}>
          {scale.label}
        </Text>
      </div>
      <ul aria-describedby={labelId} {...stylex.props(styles.swatchList)}>
        {scale.swatches.map((swatch) => (
          <ColorSwatchButton key={swatch.token} swatch={swatch} />
        ))}
      </ul>
    </div>
  );
}

export function ColorFoundationPage(): ReactElement {
  const { resolvedTheme } = useTheme();
  const mode: ThemeMode = resolvedTheme === "dark" ? "dark" : "light";
  const scales = getModeScales(mode);

  return (
    <>
      <DocsPage>
        <PageHeader
          title={colorsFoundationItem.title}
          description={colorsFoundationItem.description}
          source={colorsFoundationItem.source}
        />

        <Section
          title="Scales"
          description="Primitive color scales from value.stylex.ts. Select a swatch to copy its OKLCH value. Light mode shows gray scales; dark mode shows neutral scales."
        >
          <div {...stylex.props(styles.scaleRows)}>
            <ScaleStepHeader />
            {scales.map((scale) => (
              <ColorScaleRow key={scale.label} scale={scale} />
            ))}
          </div>
        </Section>

        {/*<Section
          title="Backgrounds"
          description="There are two background colors for pages and UI components. In most cases, use "
        >

        </Section>*/}

      </DocsPage>
      <Toaster />
    </>
  );
}

const styles = stylex.create({
  scaleRows: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    paddingBottom: 4,
  },
  scaleRow: {
    alignItems: {
      default: "flex-start",
      "@media (min-width: 768px)": "center",
    },
    display: "flex",
    flexDirection: {
      default: "column",
      "@media (min-width: 768px)": "row",
    },
    gap: 8,
    width: "100%",
  },
  labelColumn: {
    flexShrink: 0,
    width: {
      default: "100%",
      "@media (min-width: 768px)": 100,
    },
  },
  scaleLabel: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
    margin: 0,
  },
  swatchList: {
    display: "flex",
    gap: {
      default: 4,
      "@media (min-width: 768px)": 8,
    },
    listStyle: "none",
    margin: 0,
    minWidth: 0,
    padding: 0,
    width: "100%",
  },
  stepHeader: {
    alignItems: "center",
    display: {
      default: "none",
      "@media (min-width: 768px)": "flex",
    },
    gap: 8,
    width: "100%",
  },
  swatchItem: {
    flexShrink: 1,
    maxWidth: 68,
    width: "100%",
  },
  stepHeaderItem: {
    color: "light-dark(oklch(0.205 0 none), oklch(0.97 0 none))",
    fontFamily: "'Geist', 'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
    maxWidth: 68,
    textAlign: "center",
    width: "100%",
  },
  swatchButton: {
    appearance: "none",
    aspectRatio: {
      default: "1 / 1",
      "@media (min-width: 768px)": "auto",
    },
    backgroundColor: "transparent",
    borderColor: "light-dark(oklch(0.922 0 none), oklch(0.269 0 none))",
    borderRadius: 6,
    borderStyle: "solid",
    borderWidth: 1,
    boxSizing: "border-box",
    color: "inherit",
    cursor: "copy",
    display: "flex",
    flexGrow: 1,
    font: "inherit",
    height: {
      default: "auto",
      "@media (min-width: 768px)": 40,
    },
    minWidth: 0,
    padding: 0,
    width: "100%",
  },
});
