import * as stylex from "@stylexjs/stylex";

import { structuredValuePreviewStyles } from "./structuredValuePreview.styles";

export type StructuredValuePreviewVariant = "json" | "typedJson";
export type StructuredValuePreviewContinuation = "complete" | "truncated";

interface StructuredValuePreviewModelBase {
  /** Whether normalized content was omitted from the preview. */
  continuation: StructuredValuePreviewContinuation;
}

export interface StructuredValuePreviewArrayModel extends StructuredValuePreviewModelBase {
  kind: "array";
  /** Already-normalized, bounded entry labels. */
  entries: readonly string[];
  /** Complete number of entries in the source array. */
  totalCount: number;
}

export interface StructuredValuePreviewObjectEntry {
  /** Already-normalized, bounded property label. */
  label: string;
  /** Already-normalized, bounded value label. */
  value: string;
}

export interface StructuredValuePreviewObjectModel extends StructuredValuePreviewModelBase {
  kind: "object";
  /** Already-normalized, bounded property entries. */
  entries: readonly StructuredValuePreviewObjectEntry[];
  /** Complete entry count, or null when only the visible lower bound is known. */
  totalCount: number | null;
}

export interface StructuredValuePreviewScalarModel extends StructuredValuePreviewModelBase {
  kind: "scalar";
  /** Already-normalized, bounded scalar label. */
  label: string;
}

export type StructuredValuePreviewModel =
  | StructuredValuePreviewArrayModel
  | StructuredValuePreviewObjectModel
  | StructuredValuePreviewScalarModel;

export interface StructuredValuePreviewProps {
  /** Normalized bounded content prepared by the consumer. */
  model: StructuredValuePreviewModel;
  /** Distinguishes JSON from schema-backed typed JSON. */
  variant?: StructuredValuePreviewVariant;
}

interface StructuredValuePreviewParts {
  content: string | null;
  marker: string | null;
}

function createPreviewParts(model: StructuredValuePreviewModel): StructuredValuePreviewParts {
  if (model.kind === "scalar") {
    return {
      content: `${model.label}${model.continuation === "truncated" ? "…" : ""}`,
      marker: null,
    };
  }

  if (model.kind === "array") {
    if (model.totalCount === 0) {
      return { content: null, marker: "[]" };
    }
    return {
      content: [
        ...model.entries,
        ...(model.continuation === "truncated" ? ["…"] : []),
      ].join(", "),
      marker: `[${model.totalCount}]`,
    };
  }

  if (model.totalCount === 0) {
    return { content: null, marker: "{}" };
  }
  const count = model.totalCount === null ? `${model.entries.length}+` : model.totalCount;
  return {
    content: [
      ...model.entries.map(({ label, value }) => `${label}: ${value}`),
      ...(model.continuation === "truncated" ? ["…"] : []),
    ].join(", "),
    marker: `{${count}}`,
  };
}

export function StructuredValuePreview({ model, variant = "json" }: StructuredValuePreviewProps) {
  const preview = createPreviewParts(model);
  const accessibilityLabel = [preview.marker, preview.content].filter(Boolean).join(" ");

  return (
    <span {...stylex.props(structuredValuePreviewStyles.root)}>
      {variant === "typedJson" ? (
        <span
          aria-label="Typed JSON value"
          {...stylex.props(structuredValuePreviewStyles.typedMarker)}
        >
          {"{T}"}
        </span>
      ) : null}
      <code
        aria-label={accessibilityLabel}
        data-typography="mono"
        {...stylex.props(structuredValuePreviewStyles.value)}
      >
        {preview.marker === null ? null : (
          <span {...stylex.props(structuredValuePreviewStyles.markerRail)}>
            {preview.marker}
          </span>
        )}
        {preview.content === null ? null : (
          <span {...stylex.props(structuredValuePreviewStyles.preview)}>
            {preview.content}
          </span>
        )}
      </code>
    </span>
  );
}
