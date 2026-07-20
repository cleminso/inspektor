import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchPlayground, serializeSearchPlayground } from "./playground";

vi.mock("@/lib/shiki", () => ({ useHighlightedCode: () => null }));

afterEach(cleanup);

describe("Search playground", () => {
  it("omits package defaults from the initial source", () => {
    expect(
      serializeSearchPlayground({ size: "m", fullWidth: true, disabled: false, shortcut: false }),
    ).toBe(
      'import { Search } from "@inspector/ds";\n\nexport default function Example() {\n  return <Search aria-label="Search tables" placeholder="Search tables" />;\n}',
    );
  });

  it("uses one state for the preview and source, then resets it", () => {
    const { container } = render(<SearchPlayground />);

    fireEvent.click(screen.getByRole("switch", { name: "Disabled" }));
    fireEvent.click(screen.getByRole("switch", { name: "Command K shortcut" }));
    fireEvent.click(screen.getByRole("button", { name: "Show code" }));
    expect(
      (screen.getByRole("searchbox", { name: "Search tables" }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.getByLabelText("Command K")).toBeTruthy();
    expect(container.querySelector("pre")?.textContent).toContain("disabled");
    expect(container.querySelector("pre")?.textContent).toContain('shortcut="command-k"');

    fireEvent.click(screen.getByRole("button", { name: "Reset controls" }));
    expect(
      (screen.getByRole("searchbox", { name: "Search tables" }) as HTMLInputElement).disabled,
    ).toBe(false);
    expect(screen.queryByLabelText("Command K")).toBeNull();
    expect(container.querySelector("pre")?.textContent).not.toContain("disabled");
  });
});
