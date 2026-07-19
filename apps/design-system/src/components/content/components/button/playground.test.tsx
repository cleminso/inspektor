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
        shape: "default",
        radius: "xs",
        justify: "center",
        inset: "default",
        loading: false,
        disabled: false,
        fullWidth: false,
        prefix: false,
        suffix: false,
      }),
    ).toBe(
      'import { Button } from "@inspector/ds";\n\nexport default function Example() {\n  return <Button>Primary</Button>;\n}',
    );
  });

  it("updates the rendered component and source from one control state", () => {
    const { container } = render(<ButtonPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Loading" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect(screen.getByRole("button", { name: "Primary" }).getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector("pre")?.textContent).toContain("loading");
  });

  it("inlines decorative icons without adding application dependencies", () => {
    const source = serializeButtonPlayground({
      variant: "primary",
      size: "m",
      shape: "default",
      radius: "xs",
      justify: "center",
      inset: "default",
      loading: false,
      disabled: false,
      fullWidth: false,
      prefix: true,
      suffix: false,
    });

    expect(source).toContain('prefix={<svg aria-hidden="true" width={14} height={14}');
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("ArrowLeft");
  });

  it("uses the same compact adornment size as the documented Button example", () => {
    const { container } = render(<ButtonPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Prefix" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    const icon = screen.getByRole("button", { name: "Primary" }).querySelector("svg");
    expect(icon?.getAttribute("width")).toBe("14");
    expect(icon?.getAttribute("height")).toBe("14");
    expect(container.querySelector("pre")?.textContent).toContain(
      '<svg aria-hidden="true" width={14} height={14}',
    );
  });

  it("restores the initial preview and generated source", () => {
    const { container } = render(<ButtonPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Disabled" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));

    expect((screen.getByRole("button", { name: "Primary" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(container.querySelector("pre")?.textContent).not.toContain("disabled");
  });
});
