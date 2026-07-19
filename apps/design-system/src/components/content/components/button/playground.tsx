import {
  Box,
  Button,
  type ButtonInset,
  type ButtonJustify,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from "@inspector/ds";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
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
  shape: "default" | "square";
  radius: ButtonRadius;
  justify: ButtonJustify;
  inset: ButtonInset;
  loading: boolean;
  disabled: boolean;
  fullWidth: boolean;
  prefix: boolean;
  suffix: boolean;
  [key: string]: boolean | string;
}

const initialState: ButtonPlaygroundState = {
  variant: "primary",
  size: "m",
  shape: "default",
  radius: "xs",
  justify: "center",
  inset: "default",
  loading: false,
  disabled: false,
  fullWidth: false,
  prefix: false,
  suffix: false,
};

const controls = [
  {
    kind: "select",
    key: "variant",
    label: "Variant",
    options: ["primary", "secondary", "danger", "ghost", "outline", "link"].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["s", "m", "l"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "shape",
    label: "Shape",
    options: ["default", "square"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "radius",
    label: "Radius",
    options: ["none", "xs", "s", "m", "l", "xl"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "justify",
    label: "Justify",
    options: ["center", "start", "between"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "inset",
    label: "Inset",
    options: ["default", "flush"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "loading", label: "Loading" },
  { kind: "boolean", key: "disabled", label: "Disabled" },
  { kind: "boolean", key: "fullWidth", label: "Full width" },
  { kind: "boolean", key: "prefix", label: "Prefix" },
  { kind: "boolean", key: "suffix", label: "Suffix" },
] as const satisfies readonly PlaygroundControl<ButtonPlaygroundState>[];

function serializeProps(state: ButtonPlaygroundState): string[] {
  const props: string[] = [];
  if (state.variant !== "primary") props.push(`variant="${state.variant}"`);
  if (state.size !== "m") props.push(`size="${state.size}"`);
  if (state.shape === "square") props.push('shape="square"', 'aria-label="Add item"');
  if (state.radius !== "xs") props.push(`radius="${state.radius}"`);
  if (state.justify !== "center") props.push(`justify="${state.justify}"`);
  if (state.inset !== "default") props.push(`inset="${state.inset}"`);
  if (state.loading === true) props.push("loading");
  if (state.disabled === true) props.push("disabled");
  if (state.fullWidth === true) props.push("fullWidth");
  if (state.prefix === true && state.shape === "default") {
    props.push(`prefix={${playgroundIconSource.arrowLeft}}`);
  }
  if (state.suffix === true && state.shape === "default") {
    props.push(`suffix={${playgroundIconSource.arrowRight}}`);
  }
  return props;
}

export function serializeButtonPlayground(state: ButtonPlaygroundState): string {
  const props = serializeProps(state);
  const child = state.shape === "square" ? playgroundIconSource.plus : "Primary";
  const button =
    props.length === 0
      ? `<Button>${child}</Button>`
      : `<Button\n    ${props.join("\n    ")}\n  >${child}</Button>`;

  return createPlaygroundSource({ imports: { Button: true }, example: button });
}

export function ButtonPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<ButtonPlaygroundState>(initialState);
  const isSquare = state.shape === "square";
  const preview = (
    <Box>
      <Button
        variant={state.variant}
        size={state.size}
        shape={isSquare === true ? "square" : undefined}
        radius={state.radius}
        justify={state.justify}
        inset={state.inset}
        loading={state.loading}
        disabled={state.disabled}
        fullWidth={state.fullWidth}
        prefix={state.prefix === true && isSquare === false ? <ArrowLeft size={14} /> : undefined}
        suffix={state.suffix === true && isSquare === false ? <ArrowRight size={14} /> : undefined}
        aria-label={isSquare === true ? "Add item" : undefined}
      >
        {isSquare === true ? <Plus /> : "Primary"}
      </Button>
    </Box>
  );
  const controlPane = (
    <PlaygroundControls
      controls={controls}
      state={state}
      onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
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
