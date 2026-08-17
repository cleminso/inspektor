import * as stylex from "@stylexjs/stylex";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FloatingPanel } from "./floatingPanel";
import { floatingPanelStyles } from "./floatingPanel.styles";

const originalAnimate = HTMLElement.prototype.animate;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: originalAnimate,
  });
});

describe("FloatingPanel", () => {
  it("portals a labelled non-modal surface to the document body", () => {
    const { container } = render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content>Review</FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    const panel = screen.getByRole("complementary", { name: "Pending changes" });
    expect(document.body.contains(panel)).toBe(true);
    expect(container.contains(panel)).toBe(false);
    expect(panel.getAttribute("role")).toBeNull();
    expect(document.querySelector("[data-slot='floating-panel-backdrop']")).toBeNull();
  });

  it("uses the compact content width by default", () => {
    render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content>Review</FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    const content = document.querySelector("[data-slot='floating-panel-content']");
    expect(content?.getAttribute("data-size")).toBe("compact");
    expect(content?.className).toContain(
      stylex.props(floatingPanelStyles.contentCompact).className,
    );
  });

  it("supports an expanded content width", () => {
    render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">Review</FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    const content = document.querySelector("[data-slot='floating-panel-content']");
    expect(content?.getAttribute("data-size")).toBe("expanded");
    expect(content?.className).toContain(
      stylex.props(floatingPanelStyles.contentExpanded).className,
    );
  });

  it("keeps closing details mounted until their exit motion completes", async () => {
    let finishExit: () => void = () => undefined;
    const cancel = vi.fn();
    const animate = vi.fn(() => ({
      cancel,
      finished: new Promise<void>((resolve) => {
        finishExit = resolve;
      }),
    }) as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
    });
    const onExitComplete = vi.fn();
    const { rerender } = render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
          <FloatingPanel.Summary>Summary</FloatingPanel.Summary>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );
    const openDetails = document.querySelector("[data-slot='floating-panel-details']");
    expect(openDetails).toBeInstanceOf(HTMLElement);
    Object.defineProperties(openDetails, {
      offsetHeight: { configurable: true, value: 96 },
      scrollHeight: { configurable: true, value: 96 },
    });

    rerender(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open={false} onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
          <FloatingPanel.Summary>Summary</FloatingPanel.Summary>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    const details = document.querySelector("[data-slot='floating-panel-details']");
    expect(details?.getAttribute("aria-hidden")).toBe("true");
    expect(details?.hasAttribute("inert")).toBe(true);
    expect(animate).toHaveBeenCalledWith(
      [
        { height: "96px", opacity: 1, transform: "translateY(0)" },
        { height: "0px", opacity: 0, transform: "translateY(0.25rem)" },
      ],
      expect.objectContaining({ duration: 120 }),
    );
    expect(onExitComplete).not.toHaveBeenCalled();

    await act(async () => finishExit());

    expect(document.querySelector("[data-slot='floating-panel-details']")).toBeNull();
    expect(onExitComplete).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("removes closing details without motion when reduced motion is requested", async () => {
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const onExitComplete = vi.fn();
    const { rerender } = render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    rerender(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open={false} onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );
    await act(async () => undefined);

    expect(animate).not.toHaveBeenCalled();
    expect(document.querySelector("[data-slot='floating-panel-details']")).toBeNull();
    expect(onExitComplete).toHaveBeenCalledOnce();
  });

  it("retargets an interrupted details exit from its visible position", async () => {
    let finishExit: () => void = () => undefined;
    const cancelExit = vi.fn();
    const cancelReturn = vi.fn();
    const animate = vi
      .fn()
      .mockImplementationOnce(
        () =>
          ({
            cancel: cancelExit,
            finished: new Promise<void>((resolve) => {
              finishExit = resolve;
            }),
          }) as unknown as Animation,
      )
      .mockImplementationOnce(
        () =>
          ({
            cancel: cancelReturn,
            finished: Promise.resolve(),
          }) as unknown as Animation,
      );
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
    });
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        height: "40px",
        opacity: "0.4",
        transform: "matrix(1, 0, 0, 1, 0, 5)",
      })),
    );
    const onExitComplete = vi.fn();
    const { rerender } = render(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );
    const openDetails = document.querySelector("[data-slot='floating-panel-details']");
    expect(openDetails).toBeInstanceOf(HTMLElement);
    Object.defineProperties(openDetails, {
      offsetHeight: { configurable: true, value: 96 },
      scrollHeight: { configurable: true, value: 96 },
    });

    rerender(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open={false} onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );
    rerender(
      <FloatingPanel.Root aria-label="Pending changes">
        <FloatingPanel.Content size="expanded">
          <FloatingPanel.Details open onExitComplete={onExitComplete}>
            Review
          </FloatingPanel.Details>
        </FloatingPanel.Content>
      </FloatingPanel.Root>,
    );

    expect(cancelExit).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenLastCalledWith(
      [
        {
          height: "40px",
          opacity: 0.4,
          transform: "matrix(1, 0, 0, 1, 0, 5)",
        },
        { height: "96px", opacity: 1, transform: "translateY(0)" },
      ],
      expect.objectContaining({ duration: 160 }),
    );
    expect(onExitComplete).not.toHaveBeenCalled();

    await act(async () => finishExit());
    expect(document.querySelector("[data-slot='floating-panel-details']")).not.toBeNull();
  });
});
