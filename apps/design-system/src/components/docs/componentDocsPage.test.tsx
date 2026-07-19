import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComponentDocsPage } from "./componentDocsPage";
import { AppShellLayoutProvider } from "@/layout/appShellLayout";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ComponentDocsPage", () => {
  it("places existing documentation below the playground and exposes component controls", () => {
    render(
      <ComponentDocsPage
        title="Button"
        description="Action primitive"
        source={{
          label: "button.tsx",
          path: "packages/design-system/src/components/button/button.tsx",
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { Button } from "@inspector/ds";'}
        controls={<div>Variant control</div>}
      >
        <section aria-label="Existing examples">Sizes</section>
      </ComponentDocsPage>,
    );

    expect(screen.getByRole("region", { name: "Button playground" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Button playground" }).getAttribute("style")).not.toContain(
      "max-width:",
    );
    expect(screen.getByRole("complementary", { name: "Button controls" }).textContent).toContain(
      "Variant control",
    );
    const documentation = screen.getByRole("region", { name: "Button documentation" });
    expect(documentation.textContent).toContain("Sizes");
    expect(documentation.querySelector("div")?.getAttribute("style")).toContain("width: 100%;");
  });

  it("keeps the toolbar and controls fixed while only the center content scrolls", () => {
    render(
      <ComponentDocsPage
        title="Copy Button"
        description="Copy action"
        source={{
          label: "copyButton.tsx",
          path: "packages/design-system/src/components/copyButton/copyButton.tsx",
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { CopyButton } from "@inspector/ds";'}
        controls={<div>Controls</div>}
      />,
    );

    const toolbar = screen.getByRole("banner");
    const scrollArea = document.querySelector('[data-scroll-area="main-content"]');

    expect(scrollArea).not.toBeNull();
    expect(scrollArea?.contains(toolbar)).toBe(false);
    expect(toolbar.nextElementSibling).toBe(scrollArea);
    expect(scrollArea?.getAttribute("style")).toContain("width: 100%;");
    expect(screen.getByRole("region", { name: "Copy Button playground" }).getAttribute("style")).toContain(
      "min-width: 0px;",
    );
    expect(
      screen
        .getByRole("complementary", { name: "Copy Button controls" })
        .getAttribute("data-scrollable"),
    ).toBe("false");
  });

  it("navigates through component registry order", () => {
    render(
      <ComponentDocsPage
        title="Copy Button"
        description="Copy action"
        source={{
          label: "copyButton.tsx",
          path: "packages/design-system/src/components/copyButton/copyButton.tsx",
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { CopyButton } from "@inspector/ds";'}
        controls={<div>Controls</div>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous page: Context Switcher" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/components/context-switcher" });

    fireEvent.click(screen.getByRole("button", { name: "Next page: Input" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/components/input" });
  });

  it("continues toolbar navigation across registry sections and wraps at both ends", () => {
    const { rerender } = render(
      <ComponentDocsPage
        title="Button"
        description="Action primitive"
        source={{
          label: "button.tsx",
          path: "packages/design-system/src/components/button/button.tsx",
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { Button } from "@inspector/ds";'}
        controls={<div>Controls</div>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous page: Typography" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/foundations/typography" });

    rerender(
      <ComponentDocsPage
        title="Toggle Group"
        description="Related controls"
        source={{
          label: "toggleGroup.tsx",
          path: "packages/design-system/src/components/toggleGroup/toggleGroup.tsx",
        }}
        preview={<button type="button">Preview</button>}
        sourceCode={'import { ToggleGroup } from "@inspector/ds";'}
        controls={<div>Controls</div>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next page: Colors" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/foundations/colors" });
  });

  it("preserves a closed controls pane when the component page remounts", () => {
    const { rerender } = render(
      <AppShellLayoutProvider>
        <ComponentDocsPage
          key="button"
          title="Button"
          description="Action primitive"
          source={{
            label: "button.tsx",
            path: "packages/design-system/src/components/button/button.tsx",
          }}
          preview={<button type="button">Preview</button>}
          sourceCode={'import { Button } from "@inspector/ds";'}
          controls={<div>Button controls</div>}
        />
      </AppShellLayoutProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide controls" }));
    expect(screen.queryByRole("complementary", { name: "Button controls" })).toBeNull();

    rerender(
      <AppShellLayoutProvider>
        <ComponentDocsPage
          key="checkbox"
          title="Checkbox"
          description="Selection control"
          source={{
            label: "checkbox.tsx",
            path: "packages/design-system/src/components/checkbox/checkbox.tsx",
          }}
          preview={<button type="button">Preview</button>}
          sourceCode={'import { Checkbox } from "@inspector/ds";'}
          controls={<div>Checkbox controls</div>}
        />
      </AppShellLayoutProvider>,
    );

    expect(screen.queryByRole("complementary", { name: "Checkbox controls" })).toBeNull();
    expect(screen.getByRole("button", { name: "Show controls" })).toBeTruthy();
  });
});
