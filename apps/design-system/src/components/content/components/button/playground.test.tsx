import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ButtonPlayground, serializeButtonPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Button playground", () => {
  it("serializes the initial component without redundant default props", () => {
    expect(
      serializeButtonPlayground({
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
      }),
    ).toBe(
      'import { Button } from "@inspector/ds";\n\nexport default function Example() {\n  return <Button>Primary</Button>;\n}',
    );
  });

  it("inlines decorative icons without adding application dependencies", () => {
    const source = serializeButtonPlayground({
      variant: "primary",
      size: "m",
      radius: "xs",
      justify: "center",
      loading: false,
      disabled: false,
      iconOnly: false,
      fullWidth: false,
      prefix: true,
      suffix: false,
    });

    expect(source).toContain('prefix={<svg aria-hidden="true" width={14} height={14}');
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("ArrowLeft");
  });

  it("renders and serializes an accessible icon-only Button", () => {
    const { container } = render(<ButtonPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Icon only" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(
      screen.getByRole("button", { name: "Primary action" }).getAttribute("data-icon-only"),
    ).toBe("");
    expect(container.querySelector("pre")?.textContent).toContain("iconOnly");
    expect(container.querySelector("pre")?.textContent).toContain('aria-label="Primary action"');
    expect(container.querySelector("pre")?.textContent).toContain(
      '<svg aria-hidden="true" width={14} height={14}',
    );
  });
});
