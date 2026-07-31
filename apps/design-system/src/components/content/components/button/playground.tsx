import {
  Box,
  Button,
  Icon,
  type ButtonJustify,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from "@inspector/ds";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import {
  createPlaygroundSource,
  playgroundIconSource,
} from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { buttonItem } from "@/lib/registry";

export interface ButtonPlaygroundState {
  variant: ButtonVariant;
  size: ButtonSize;
  radius: ButtonRadius;
  justify: ButtonJustify;
  loading: boolean;
  disabled: boolean;
  iconOnly: boolean;
  fullWidth: boolean;
  prefix: boolean;
  suffix: boolean;
  [key: string]: boolean | string;
}

const initialState: ButtonPlaygroundState = {
  variant: "primary",
  size: "m",
  radius: "xs",
  justify: "center",
  loading: false,
  disabled: false,
  iconOnly: false,
  fullWidth: false,
  prefix: false,
  suffix: false,
};

const controls = [
  {
    kind: "select",
    key: "variant",
    label: "Variant",
    options: ["primary", "secondary", "danger", "ghost", "link"].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["xs", "s", "m"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "radius",
    label: "Radius",
    options: ["none", "xs", "s", "m"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "justify",
    label: "Justify",
    options: ["center", "start", "between"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "loading", label: "Loading" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "iconOnly", label: "Icon only" },
  { kind: "boolean", key: "fullWidth", label: "Full width" },
  { kind: "boolean", key: "prefix", label: "Prefix" },
  { kind: "boolean", key: "suffix", label: "Suffix" },
] as const satisfies readonly PlaygroundControl<ButtonPlaygroundState>[];

function serializeProps(state: ButtonPlaygroundState): string[] {
  const props: string[] = [];
  if (state.variant !== "primary") props.push(`variant="${state.variant}"`);
  if (state.size !== "m") props.push(`size="${state.size}"`);
  if (state.radius !== "xs") props.push(`radius="${state.radius}"`);
  if (state.justify !== "center") props.push(`justify="${state.justify}"`);
  if (state.loading === true) props.push("loading");
  if (state.disabled === true) props.push("disabled");
  if (state.iconOnly === true) {
    props.push("iconOnly");
    props.push('aria-label="Primary action"');
    return props;
  }
  if (state.fullWidth === true) props.push("fullWidth");
  if (state.prefix === true) {
    props.push(`prefix={${playgroundIconSource.arrowLeft}}`);
  }
  if (state.suffix === true) {
    props.push(`suffix={${playgroundIconSource.arrowRight}}`);
  }
  return props;
}

export function serializeButtonPlayground(state: ButtonPlaygroundState): string {
  const props = serializeProps(state);
  const children =
    state.iconOnly === true ? playgroundIconSource.arrowRight : "Primary";
  const button =
    props.length === 0
      ? `<Button>Primary</Button>`
      : `<Button\n    ${props.join("\n    ")}\n  >${children}</Button>`;

  return createPlaygroundSource({ imports: { Button: true }, example: button });
}

export function ButtonPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<ButtonPlaygroundState>(initialState);
  const sharedPreviewProps = {
    variant: state.variant,
    size: state.size,
    radius: state.radius,
    loading: state.loading,
    disabled: state.disabled,
  } as const;
  const preview = state.iconOnly === true ? (
    <Box>
      <Button {...sharedPreviewProps} iconOnly aria-label="Primary action">
        <Icon render={<ArrowRight />} size="s" />
      </Button>
    </Box>
  ) : (
    <Box>
      <Button
        {...sharedPreviewProps}
        justify={state.justify}
        fullWidth={state.fullWidth}
        prefix={state.prefix === true ? <Icon render={<ArrowLeft />} size="s" /> : undefined}
        suffix={state.suffix === true ? <Icon render={<ArrowRight />} size="s" /> : undefined}
      >
        Primary
      </Button>
    </Box>
  );
  const controlPane = (
    <PlaygroundControls
      controls={controls}
      state={state}
      onChange={(key, value) =>
        setState((current) => {
          if (key === "iconOnly" && value === true) {
            return {
              ...current,
              iconOnly: true,
              fullWidth: false,
              justify: "center",
              prefix: false,
              suffix: false,
            };
          }

          const usesLabelLayout =
            key === "fullWidth" || key === "justify" || key === "prefix" || key === "suffix";
          return {
            ...current,
            [key]: value,
            iconOnly: usesLabelLayout === true ? false : current.iconOnly,
          };
        })
      }
      onReset={() => setState(initialState)}
    />
  );

  return (
    <ComponentDocsPage
      title={buttonItem.title}
      description={buttonItem.description}
      source={buttonItem.source}
      preview={preview}
      sourceCode={serializeButtonPlayground(state)}
      controls={controlPane}
    >
      {children}
    </ComponentDocsPage>
  );
}
