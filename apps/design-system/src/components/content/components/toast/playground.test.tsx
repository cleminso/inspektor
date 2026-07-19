import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toasts } from "@inspector/ds";
import { afterEach, describe, expect, it, vi } from "vitest";

import { serializeToastPlayground, ToastPlayground } from "./playground";
import { ToastPage } from "./page";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(async () => {
  toasts.dismiss();
  await new Promise((resolve) => window.setTimeout(resolve, 1_000));
  cleanup();
});

describe("Toast playground", () => {
  it("mounts one toaster when the playground and examples are composed", () => {
    render(<ToastPage />);

    expect(document.querySelectorAll('[data-slot="toast-viewport"]')).toHaveLength(1);
  });

  it("serializes the initial trigger scenario", () => {
    expect(
      serializeToastPlayground({
        status: "message",
        description: false,
        preserve: false,
        undo: false,
      }),
    ).toContain('onClick={() => toasts.message("Row inserted")}');
  });

  it("triggers a toast and keeps its source synchronized with options", async () => {
    const { container } = render(<ToastPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Description" }));
    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(await screen.findByText("Additional context for this notification")).toBeTruthy();
    expect(container.querySelector("pre")?.textContent).toContain("description:");
  });

  it("resets the generated trigger scenario", () => {
    const { container } = render(<ToastPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Preserve" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(container.querySelector("pre")?.textContent).not.toContain("preserve:");
  });
});
