"use client";

import * as stylex from "@stylexjs/stylex";
import { createPortal } from "react-dom";
import type { ComponentPropsWithRef } from "react";

import { floatingPanelStyles } from "./floatingPanel.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style">;
type FloatingPanelAccessibleName =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };

/** Props for the labelled non-modal surface portalled to the document body. */
export type FloatingPanelRootProps = Omit<
  WithoutStyles<ComponentPropsWithRef<"aside">>,
  "aria-label" | "aria-labelledby"
> &
  FloatingPanelAccessibleName;
/** Props for the raised panel surface rendered inside the fixed portal boundary. */
export type FloatingPanelContentProps = WithoutStyles<ComponentPropsWithRef<"div">>;
/** Props for the compact status and primary-action row. */
export type FloatingPanelSummaryProps = WithoutStyles<ComponentPropsWithRef<"div">>;
/** Props for a wrapping group of related panel actions. */
export type FloatingPanelActionsProps = WithoutStyles<ComponentPropsWithRef<"div">>;

function FloatingPanelRoot({ children, ...props }: FloatingPanelRootProps): React.ReactPortal | null {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <aside
      {...props}
      {...stylex.props(floatingPanelStyles.root)}
      data-slot="floating-panel"
    >
      {children}
    </aside>,
    document.body,
  );
}

function FloatingPanelContent(props: FloatingPanelContentProps): React.ReactElement {
  return (
    <div
      {...props}
      {...stylex.props(floatingPanelStyles.content)}
      data-slot="floating-panel-content"
    />
  );
}

function FloatingPanelSummary(props: FloatingPanelSummaryProps): React.ReactElement {
  return (
    <div
      {...props}
      {...stylex.props(floatingPanelStyles.summary)}
      data-slot="floating-panel-summary"
    />
  );
}

function FloatingPanelActions(props: FloatingPanelActionsProps): React.ReactElement {
  return (
    <div
      {...props}
      {...stylex.props(floatingPanelStyles.actions)}
      data-slot="floating-panel-actions"
    />
  );
}

export const FloatingPanel = Object.assign(FloatingPanelRoot, {
  Root: FloatingPanelRoot,
  Actions: FloatingPanelActions,
  Content: FloatingPanelContent,
  Summary: FloatingPanelSummary,
});
