"use client";

import * as stylex from "@stylexjs/stylex";
import { createPortal } from "react-dom";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ForwardedRef,
} from "react";

import { floatingPanelStyles } from "./floatingPanel.styles";

type WithoutStyles<Props> = Omit<Props, "className" | "style">;
type FloatingPanelAccessibleName =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-label"?: never; "aria-labelledby": string };
export type FloatingPanelContentSize = "compact" | "expanded";

/** Props for the labelled non-modal surface portalled to the document body. */
export type FloatingPanelRootProps = Omit<
  WithoutStyles<ComponentPropsWithRef<"aside">>,
  "aria-label" | "aria-labelledby"
> &
  FloatingPanelAccessibleName;
/** Props for the raised panel surface rendered inside the fixed portal boundary. */
export type FloatingPanelContentProps = WithoutStyles<ComponentPropsWithRef<"div">> & {
  /** Controls the constrained panel width. */
  size?: FloatingPanelContentSize;
};
/** Props for optional panel details that leave while the panel contracts. */
export type FloatingPanelDetailsProps = Omit<
  WithoutStyles<ComponentPropsWithRef<"div">>,
  "aria-hidden" | "inert"
> & {
  /** Keeps the details visible and interactive. */
  open: boolean;
};
/** Props for the compact status and primary-action row. */
export type FloatingPanelSummaryProps = WithoutStyles<ComponentPropsWithRef<"div">>;
/** Props for a wrapping group of related panel actions. */
export type FloatingPanelActionsProps = WithoutStyles<ComponentPropsWithRef<"div">>;

type DetailsMotionFrame = {
  height: string;
  opacity: number;
  transform: string;
};

const detailsOpenFrame = { opacity: 1, transform: "translateY(0)" } as const;
const detailsClosedFrame = { opacity: 0, transform: "translateY(0.25rem)" } as const;

function readDetailsMotionFrame(element: HTMLDivElement): DetailsMotionFrame {
  const styles = window.getComputedStyle(element);
  const opacity = Number.parseFloat(styles.opacity);
  return {
    height: styles.height,
    opacity: Number.isFinite(opacity) ? opacity : 1,
    transform: styles.transform === "none" ? detailsOpenFrame.transform : styles.transform,
  };
}

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

const contentSizeStyles = {
  compact: floatingPanelStyles.contentCompact,
  expanded: floatingPanelStyles.contentExpanded,
} satisfies Record<FloatingPanelContentSize, unknown>;

function setForwardedRef(ref: ForwardedRef<HTMLDivElement>, node: HTMLDivElement | null): void {
  if (typeof ref === "function") {
    ref(node);
  } else if (ref !== null) {
    ref.current = node;
  }
}

const FloatingPanelContent = forwardRef<HTMLDivElement, FloatingPanelContentProps>(
  function FloatingPanelContent({ size = "compact", ...props }, forwardedRef): React.ReactElement {
    const contentStyleProps = stylex.props(
      floatingPanelStyles.content,
      contentSizeStyles[size],
    );

    return (
      <div
        {...props}
        ref={forwardedRef}
        {...contentStyleProps}
        data-size={size}
        data-slot="floating-panel-content"
      />
    );
  },
);

const FloatingPanelDetails = forwardRef<HTMLDivElement, FloatingPanelDetailsProps>(
  function FloatingPanelDetails(
    { children, open, ...props },
    forwardedRef,
  ): React.ReactElement | null {
    const [detailsElement, setDetailsElement] = useState<HTMLDivElement | null>(null);
    const [present, setPresent] = useState(open);
    const interruptedFrameRef = useRef<DetailsMotionFrame | null>(null);
    const setDetailsRef = useCallback(
      (node: HTMLDivElement | null) => {
        setDetailsElement(node);
        setForwardedRef(forwardedRef, node);
      },
      [forwardedRef],
    );

    useLayoutEffect(() => {
      if (open === true) {
        setPresent(true);
      }
    }, [open]);

    useEffect(() => {
      if (present === false || detailsElement === null) {
        return;
      }

      const finishExit = () => {
        interruptedFrameRef.current = null;
        setPresent(false);
      };
      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
      const interruptedFrame = interruptedFrameRef.current;
      interruptedFrameRef.current = null;

      if (open === true && interruptedFrame === null) {
        return;
      }

      if (reducedMotion === true || typeof detailsElement.animate !== "function") {
        if (open === false) {
          finishExit();
        }
        return;
      }

      const opening = open === true;
      const openFrame = {
        height: `${opening ? detailsElement.scrollHeight : detailsElement.offsetHeight}px`,
        ...detailsOpenFrame,
      } satisfies DetailsMotionFrame;
      const startFrame = interruptedFrame ?? openFrame;
      const endFrame = opening
        ? ({ height: `${detailsElement.scrollHeight}px`, ...detailsOpenFrame } satisfies DetailsMotionFrame)
        : ({ height: "0px", ...detailsClosedFrame } satisfies DetailsMotionFrame);
      const keyframes: Keyframe[] = [
        {
          height: startFrame.height,
          opacity: startFrame.opacity,
          transform: startFrame.transform,
        },
        {
          height: endFrame.height,
          opacity: endFrame.opacity,
          transform: endFrame.transform,
        },
      ];

      let cancelled = false;
      let completed = false;
      const animation = detailsElement.animate(
        keyframes,
        {
          duration: opening ? 160 : 120,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          fill: "forwards",
        },
      );
      void animation.finished
        .then(() => {
          if (cancelled === false) {
            completed = true;
            interruptedFrameRef.current = null;
            if (opening === false) {
              finishExit();
            } else {
              animation.cancel();
            }
          }
        })
        .catch(() => undefined);

      return () => {
        if (completed === false) {
          interruptedFrameRef.current = readDetailsMotionFrame(detailsElement);
        }
        cancelled = true;
        animation.cancel();
      };
    }, [detailsElement, open, present]);

    if (present === false) {
      return null;
    }

    return (
      <div
        {...props}
        ref={setDetailsRef}
        {...stylex.props(floatingPanelStyles.details)}
        aria-hidden={open === false ? true : undefined}
        data-open={open}
        data-slot="floating-panel-details"
        inert={open === false ? true : undefined}
      >
        {children}
      </div>
    );
  },
);

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
  Details: FloatingPanelDetails,
  Summary: FloatingPanelSummary,
});
